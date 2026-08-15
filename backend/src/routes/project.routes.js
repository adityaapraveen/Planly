import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'

import {
    createProjectController,
    updateProjectController,
    getProjectController,
    getProjectsController,
    deleteProjectController
} from '../controllers/project.controller.js'
import {
    askProjectQuestionController,
    getProjectChecksController,
    getProjectQuestionsController,
    searchProjectController,
    updateProjectCheckController
} from '../controllers/project-intelligence.controller.js'
import { questionRateLimit } from '../middlewares/rateLimits.js'

export const projectRouter = express.Router()

projectRouter.use(requireAuth)

projectRouter
  .route('/')
  .post(createProjectController)
  .get(getProjectsController)

projectRouter
  .route('/:projectId')
  .get(getProjectController)
  .patch(updateProjectController)
  .delete(deleteProjectController)

projectRouter.get('/:projectId/search', searchProjectController)
projectRouter
  .route('/:projectId/questions')
  .get(getProjectQuestionsController)
  .post(questionRateLimit, askProjectQuestionController)
projectRouter.get('/:projectId/checks', getProjectChecksController)
projectRouter.patch('/:projectId/checks/:checkKey', updateProjectCheckController)
