/**
 * Kontroler untuk AI Logging Analytics
 * Digunakan untuk evaluasi akademik efektivitas AI dalam sistem monitoring
 */

const express = require('express');
const router = express.Router();
const aiLoggingService = require('../layanan/aiLoggingService');
const { authenticateToken, requireRole } = require('../middleware/autentikasi');
const { logger } = require('../utilitas/logger');

/**
 * GET /api/ai-analytics/summary
 * Mendapatkan ringkasan analytics AI untuk periode tertentu
 */
router.get('/summary', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 hari terakhir
      endDate = new Date(),
      serverId,
      userId,
      aiType
    } = req.query;

    const summary = await aiLoggingService.getAnalyticsSummary({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      serverId,
      userId,
      aiType
    });

    res.json({
      success: true,
      data: summary,
      metadata: {
        period: { startDate, endDate },
        filters: { serverId, userId, aiType }
      }
    });

  } catch (error) {
    logger.logError('AI_ANALYTICS_SUMMARY_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan ringkasan analytics AI'
    });
  }
});

/**
 * GET /api/ai-analytics/performance-metrics
 * Mendapatkan metrics performa AI (accuracy, response time, dll)
 */
router.get('/performance-metrics', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 hari terakhir
      endDate = new Date(),
      aiType,
      groupBy = 'day'
    } = req.query;

    const metrics = await aiLoggingService.getPerformanceMetrics({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      aiType,
      groupBy
    });

    res.json({
      success: true,
      data: metrics,
      metadata: {
        period: { startDate, endDate },
        groupBy,
        aiType
      }
    });

  } catch (error) {
    logger.logError('AI_PERFORMANCE_METRICS_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan metrics performa AI'
    });
  }
});

/**
 * GET /api/ai-analytics/user-interactions
 * Menganalisis pola interaksi user dengan AI
 */
router.get('/user-interactions', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      userId,
      interactionType
    } = req.query;

    const interactions = await aiLoggingService.getUserInteractionAnalysis({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId,
      interactionType
    });

    res.json({
      success: true,
      data: interactions,
      metadata: {
        period: { startDate, endDate },
        filters: { userId, interactionType }
      }
    });

  } catch (error) {
    logger.logError('AI_USER_INTERACTIONS_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan analisis interaksi user'
    });
  }
});

/**
 * GET /api/ai-analytics/alert-analysis-effectiveness
 * Mengukur efektivitas analisis AI dalam alert system
 */
router.get('/alert-analysis-effectiveness', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      serverId
    } = req.query;

    const effectiveness = await aiLoggingService.getAlertAnalysisEffectiveness({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      serverId
    });

    res.json({
      success: true,
      data: effectiveness,
      metadata: {
        period: { startDate, endDate },
        serverId
      }
    });

  } catch (error) {
    logger.logError('AI_ALERT_EFFECTIVENESS_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan data efektivitas analisis alert'
    });
  }
});

/**
 * GET /api/ai-analytics/research-export
 * Export data untuk penelitian akademik
 */
router.get('/research-export', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 hari terakhir
      endDate = new Date(),
      format = 'json',
      includeMetadata = true
    } = req.query;

    const exportData = await aiLoggingService.exportResearchData({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
      includeMetadata: includeMetadata === 'true'
    });

    // Set headers berdasarkan format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-research-data.csv"');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-research-data.json"');
    }

    res.send(exportData);

  } catch (error) {
    logger.logError('AI_RESEARCH_EXPORT_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal export data penelitian'
    });
  }
});

/**
 * GET /api/ai-analytics/logs/:logId
 * Mendapatkan detail log AI tertentu
 */
router.get('/logs/:logId', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const { logId } = req.params;
    const logDetail = await aiLoggingService.getLogDetail(logId);

    if (!logDetail) {
      return res.status(404).json({
        success: false,
        error: 'Log AI tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: logDetail
    });

  } catch (error) {
    logger.logError('AI_LOG_DETAIL_ERROR', error, { logId: req.params.logId });
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan detail log AI'
    });
  }
});

/**
 * POST /api/ai-analytics/logs/:logId/outcome
 * Update outcome dari interaksi AI (untuk evaluasi akademik)
 */
router.post('/logs/:logId/outcome', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const { logId } = req.params;
    const { outcome, feedback, resolvedIssues, userSatisfaction } = req.body;

    const updatedLog = await aiLoggingService.updateOutcome(logId, {
      outcome,
      feedback,
      resolvedIssues,
      userSatisfaction,
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: updatedLog,
      message: 'Outcome berhasil diupdate'
    });

  } catch (error) {
    logger.logError('AI_OUTCOME_UPDATE_ERROR', error, { logId: req.params.logId, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Gagal update outcome'
    });
  }
});

/**
 * GET /api/ai-analytics/comparative-analysis
 * Analisis komparatif performa AI vs manual monitoring
 */
router.get('/comparative-analysis', authenticateToken, requireRole(['admin', 'researcher']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      serverId
    } = req.query;

    const analysis = await aiLoggingService.getComparativeAnalysis({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      serverId
    });

    res.json({
      success: true,
      data: analysis,
      metadata: {
        period: { startDate, endDate },
        serverId,
        description: 'Perbandingan efektivitas AI vs monitoring manual'
      }
    });

  } catch (error) {
    logger.logError('AI_COMPARATIVE_ANALYSIS_ERROR', error, req.query);
    res.status(500).json({
      success: false,
      error: 'Gagal mendapatkan analisis komparatif'
    });
  }
});

module.exports = router;