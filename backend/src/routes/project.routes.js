import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'

import {
    createProjectController,
    updateProjectController,
    getProjectController,
    getProjectsController,
    deleteProjectController
} from '../controllers/project.controller.js'

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