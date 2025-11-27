import { Request, Response, NextFunction, Router } from 'express';
import { getRepository } from 'typeorm';
import Requirement from '../models/requirement.model';
import { WinstonLogger } from '../utils/logger';
import { IntegrationService } from '../services/integration.service';
import { AuditLogService } from '../services/auditlog.service';

// Initialize logger, integration, and audit log services
const logger = WinstonLogger.getInstance();
const integrationService = new IntegrationService();
const auditLogService = new AuditLogService();

// Create router
const traceabilityRouter = Router();

/**
 * @route   GET /api/traceability/matrix
 * @desc    Get the full traceability matrix for all requirements
 * @access  Protected (RBAC enforced by middleware)
 */
traceabilityRouter.get('/matrix', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementRepo = getRepository(Requirement);
    const requirements = await requirementRepo.find();

    // Optionally, fetch linked artifact details from integrations
    const enrichedRequirements = await Promise.all(
      requirements.map(async (reqmt) => {
        const userStories = reqmt.userStoryIds?.length
          ? await integrationService.getUserStories(reqmt.userStoryIds)
          : [];
        const tasks = reqmt.taskIds?.length
          ? await integrationService.getTasks(reqmt.taskIds)
          : [];
        const testCases = reqmt.testCaseIds?.length
          ? await integrationService.getTestCases(reqmt.testCaseIds)
          : [];
        const codeCommits = reqmt.codeCommitIds?.length
          ? await integrationService.getCodeCommits(reqmt.codeCommitIds)
          : [];
        const deployments = reqmt.deploymentIds?.length
          ? await integrationService.getDeployments(reqmt.deploymentIds)
          : [];

        return {
          ...reqmt,
          userStories,
          tasks,
          testCases,
          codeCommits,
          deployments,
        };
      })
    );

    await auditLogService.logAccess(req.user, 'GET_TRACEABILITY_MATRIX', { count: requirements.length });

    res.status(200).json({ matrix: enrichedRequirements });
  } catch (error) {
    logger.error('Error fetching traceability matrix:', error);
    next(error);
  }
});

/**
 * @route   GET /api/traceability/requirement/:id
 * @desc    Get traceability details for a specific requirement
 * @access  Protected (RBAC enforced by middleware)
 */
traceabilityRouter.get('/requirement/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementRepo = getRepository(Requirement);
    const requirement = await requirementRepo.findOne({ where: { id: req.params.id } });

    if (!requirement) {
      await auditLogService.logAccess(req.user, 'GET_REQUIREMENT_TRACEABILITY_NOT_FOUND', { id: req.params.id });
      return res.status(404).json({ error: 'Requirement not found' });
    }

    // Fetch linked artifact details
    const userStories = requirement.userStoryIds?.length
      ? await integrationService.getUserStories(requirement.userStoryIds)
      : [];
    const tasks = requirement.taskIds?.length
      ? await integrationService.getTasks(requirement.taskIds)
      : [];
    const testCases = requirement.testCaseIds?.length
      ? await integrationService.getTestCases(requirement.testCaseIds)
      : [];
    const codeCommits = requirement.codeCommitIds?.length
      ? await integrationService.getCodeCommits(requirement.codeCommitIds)
      : [];
    const deployments = requirement.deploymentIds?.length
      ? await integrationService.getDeployments(requirement.deploymentIds)
      : [];

    await auditLogService.logAccess(req.user, 'GET_REQUIREMENT_TRACEABILITY', { id: req.params.id });

    res.status(200).json({
      requirement: {
        ...requirement,
        userStories,
        tasks,
        testCases,
        codeCommits,
        deployments,
      },
    });
  } catch (error) {
    logger.error('Error fetching requirement traceability:', error);
    next(error);
  }
});

/**
 * @route   POST /api/traceability/requirement/:id/link
 * @desc    Link SDLC artifacts to a requirement (user stories, tasks, test cases, code commits, deployments)
 * @access  Protected (RBAC enforced by middleware)
 */
traceabilityRouter.post('/requirement/:id/link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userStoryIds, taskIds, testCaseIds, codeCommitIds, deploymentIds } = req.body;
    const requirementRepo = getRepository(Requirement);
    const requirement = await requirementRepo.findOne({ where: { id: req.params.id } });

    if (!requirement) {
      await auditLogService.logModification(req.user, 'LINK_ARTIFACTS_REQUIREMENT_NOT_FOUND', { id: req.params.id });
      return res.status(404).json({ error: 'Requirement not found' });
    }

    // Merge and deduplicate artifact IDs
    if (userStoryIds) {
      requirement.userStoryIds = Array.from(new Set([...(requirement.userStoryIds || []), ...userStoryIds]));
    }
    if (taskIds) {
      requirement.taskIds = Array.from(new Set([...(requirement.taskIds || []), ...taskIds]));
    }
    if (testCaseIds) {
      requirement.testCaseIds = Array.from(new Set([...(requirement.testCaseIds || []), ...testCaseIds]));
    }
    if (codeCommitIds) {
      requirement.codeCommitIds = Array.from(new Set([...(requirement.codeCommitIds || []), ...codeCommitIds]));
    }
    if (deploymentIds) {
      requirement.deploymentIds = Array.from(new Set([...(requirement.deploymentIds || []), ...deploymentIds]));
    }

    requirement.updatedBy = req.user?.username || 'system';

    await requirementRepo.save(requirement);

    await auditLogService.logModification(req.user, 'LINK_ARTIFACTS_TO_REQUIREMENT', {
      id: req.params.id,
      userStoryIds,
      taskIds,
      testCaseIds,
      codeCommitIds,
      deploymentIds,
    });

    res.status(200).json({ message: 'Artifacts linked successfully', requirement });
  } catch (error) {
    logger.error('Error linking artifacts to requirement:', error);
    next(error);
  }
});

/**
 * @route   GET /api/traceability/report
 * @desc    Generate traceability report (tested requirements, outcomes, deployment status, flags)
 * @access  Protected (RBAC enforced by middleware)
 */
traceabilityRouter.get('/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementRepo = getRepository(Requirement);
    const requirements = await requirementRepo.find();

    // For each requirement, fetch test and deployment status from integrations
    const report = await Promise.all(
      requirements.map(async (reqmt) => {
        const testResults = reqmt.testCaseIds?.length
          ? await integrationService.getTestResults(reqmt.testCaseIds)
          : [];
        const deploymentStatus = reqmt.deploymentIds?.length
          ? await integrationService.getDeploymentStatus(reqmt.deploymentIds)
          : [];

        return {
          id: reqmt.id,
          title: reqmt.title,
          status: reqmt.status,
          hasFailedTests: reqmt.hasFailedTests || testResults.some((tr: any) => tr.status === 'failed'),
          hasDeploymentRollback:
            reqmt.hasDeploymentRollback || deploymentStatus.some((ds: any) => ds.status === 'rollback'),
          testResults,
          deploymentStatus,
        };
      })
    );

    await auditLogService.logAccess(req.user, 'GET_TRACEABILITY_REPORT', { count: requirements.length });

    res.status(200).json({ report });
  } catch (error) {
    logger.error('Error generating traceability report:', error);
    next(error);
  }
});

/**
 * @route   PATCH /api/traceability/requirement/:id/flags
 * @desc    Update failed test or deployment rollback flags for a requirement
 * @access  Protected (RBAC enforced by middleware)
 */
traceabilityRouter.patch('/requirement/:id/flags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hasFailedTests, hasDeploymentRollback } = req.body;
    const requirementRepo = getRepository(Requirement);
    const requirement = await requirementRepo.findOne({ where: { id: req.params.id } });

    if (!requirement) {
      await auditLogService.logModification(req.user, 'UPDATE_FLAGS_REQUIREMENT_NOT_FOUND', { id: req.params.id });
      return res.status(404).json({ error: 'Requirement not found' });
    }

    if (typeof hasFailedTests === 'boolean') {
      requirement.hasFailedTests = hasFailedTests;
    }
    if (typeof hasDeploymentRollback === 'boolean') {
      requirement.hasDeploymentRollback = hasDeploymentRollback;
    }
    requirement.updatedBy = req.user?.username || 'system';

    await requirementRepo.save(requirement);

    await auditLogService.logModification(req.user, 'UPDATE_REQUIREMENT_FLAGS', {
      id: req.params.id,
      hasFailedTests,
      hasDeploymentRollback,
    });

    res.status(200).json({ message: 'Flags updated successfully', requirement });
  } catch (error) {
    logger.error('Error updating requirement flags:', error);
    next(error);
  }
});

export { traceabilityRouter };