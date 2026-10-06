"""Independently audit generated CAD files and optionally render them in LibreCAD.
Install validation-only dependency: python3 -m pip install ezdxf==1.4.4
Run: python3 scripts/validate-cad.py --render
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
import ezdxf

parser = argparse.ArgumentParser()
parser.add_argument('--render', action='store_true')
parser.add_argument('--ai', action='store_true', help='Validate the separately generated AI-layout example')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'demo-output'
if args.ai:
    plan = json.loads((out / 'planly-ai-layout.json').read_text())['plan']
    profiles = [('planly-ai-layout-R2000-mm.dxf', 'AC1015', 1000, None)]
    profiles += [(f"planly-ai-{floor['id']}-R2000-mm.dxf", 'AC1015', 1000, floor) for floor in plan['floors']]
else:
    plan = json.loads((out / 'planly-concept.json').read_text())
    profiles = [('planly-concept-metres.dxf', 'AC1009', 1, None), ('planly-concept-R2000-mm.dxf', 'AC1015', 1000, None)]
    profiles += [(f"planly-{floor['id']}-R2000-mm.dxf", 'AC1015', 1000, floor) for floor in plan['floors']]
results = []
for filename, version, scale, floor in profiles:
    path = out / filename
    doc = ezdxf.readfile(path)
    audit = doc.audit()
    assert not audit.errors and not audit.fixes, f'{filename}: audit errors or repairs'
    assert doc.dxfversion == version
    if version == 'AC1015':
        assert doc.units == 4, 'Modern mm export must declare millimetres'
    source = [line for line in plan['lines'] if floor is None or line['floorId'] == floor['id']]
    entities = list(doc.modelspace().query('LINE'))
    assert len(entities) == len(source) + 4, 'Source lines plus frame must survive import'
    offset = floor['offsetX'] if floor else 0
    for expected, actual in zip(source, entities):
        for key, value in [('x1', actual.dxf.start.x), ('y1', actual.dxf.start.y), ('x2', actual.dxf.end.x), ('y2', actual.dxf.end.y)]:
            coord = expected[key] - (offset if key.startswith('x') else 0)
            assert abs(value - round(coord, 4) * scale) < 0.0002, (filename, key, coord, value)
        assert actual.dxf.layer == expected['layer']
    expected_labels = [label for label in plan['labels'] if floor is None or label['floorId'] == floor['id']]
    assert len(doc.modelspace().query('TEXT')) == len(expected_labels)
    # A read/write/read cycle catches more than a successful initial parse.
    with tempfile.TemporaryDirectory(prefix='planly-cad-') as tmp:
        roundtrip = Path(tmp) / 'roundtrip.dxf'
        doc.saveas(roundtrip)
        again = ezdxf.readfile(roundtrip)
        assert len(again.modelspace()) == len(doc.modelspace())
        assert not again.audit().errors
    result = {'file': filename, 'version': version, 'drawingUnits': 'mm' if scale == 1000 else 'm (manual R12 convention)', 'entities': len(doc.modelspace()), 'auditErrors': 0, 'auditRepairs': 0, 'coordinateAndLayerCheck': 'PASS', 'roundtrip': 'PASS'}
    if args.render:
        subprocess.run(['librecad', 'dxf2pdf', '--fit', '--monochrome', str(path)], env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen'}, check=True, capture_output=True, timeout=60)
        pdf = path.with_suffix('.pdf')
        assert pdf.exists() and pdf.stat().st_size > 1000
        result['libreCAD'] = 'Imported and rendered to PDF'
        result['renderedPdf'] = pdf.name
    results.append(result)
report = {'scope': 'This generated example; not all application versions or arbitrary designs', 'reader': f'ezdxf {ezdxf.__version__}', 'results': results, 'notRuntimeTested': ['AutoCAD', 'Revit', 'Archicad', 'Rhino', 'BricsCAD', 'FreeCAD']}
(out / ('cad-ai-validation.json' if args.ai else 'cad-validation.json')).write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
