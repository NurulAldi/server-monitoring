// Service untuk logging keputusan AI
// Mengelola pencatatan, tracking, dan analisis keputusan AI untuk evaluasi akademik

const { logger } = require('../utilitas/logger');
const AIDecisionLog = require('../model/AIDecisionLog');
const { v4: uuidv4 } = require('uuid');

class AIService {
  constructor() {
    this.activeSessions = new Map();
  }

  /**
   * Membuat session ID untuk tracking interaksi AI
   */
  createSessionId() {
    return uuidv4();
  }

  /**
   * Memulai logging untuk alert analysis
   */
  async startAlertAnalysisLogging(alertId, serverId, userId, inputData) {
    try {
      const sessionId = this.createSessionId();

      const logEntry = new AIDecisionLog({
        sessionId,
        alertId,
        serverId,
        userId,
        decisionType: 'alert_analysis',
        aiInput: {
          prompt: inputData.prompt,
          context: {
            serverInfo: inputData.serverInfo,
            metricsData: inputData.metricsData,
            historicalData: inputData.historicalData,
            userContext: inputData.userContext
          },
          parameters: {
            model: inputData.model || 'gpt-3.5-turbo',
            temperature: inputData.temperature || 0.3,
            maxTokens: inputData.maxTokens || 1000,
            timestamp: new Date()
          }
        }
      });

      await logEntry.save();
      this.activeSessions.set(sessionId, logEntry._id);

      logger.debug('Alert analysis logging started', { sessionId, alertId });
      return { sessionId, logId: logEntry._id };

    } catch (error) {
      logger.logError('ALERT_ANALYSIS_LOGGING_START_FAILED', error, { alertId, serverId });
      throw error;
    }
  }

  /**
   * Menyelesaikan logging alert analysis dengan output AI
   */
  async completeAlertAnalysisLogging(sessionId, aiResponse, parsedData, performance) {
    try {
      const logEntry = await AIDecisionLog.findById(this.activeSessions.get(sessionId));
      if (!logEntry) {
        throw new Error(`Log entry not found for session ${sessionId}`);
      }

      // Update dengan output AI
      logEntry.aiOutput = {
        rawResponse: aiResponse,
        parsedResponse: parsedData,
        confidence: performance.confidence,
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed
      };

      // Extract decision details dari parsed data
      if (parsedData) {
        logEntry.decisionDetails.alertAnalysis = {
          severityPredicted: parsedData.severity || 'unknown',
          rootCause: parsedData.penyebabMungkin || [],
          impactAssessment: {
            technical: parsedData.analisis || '',
            business: parsedData.dampak || '',
            urgency: parsedData.prioritas || 'medium'
          }
        };

        // Extract recommendations
        if (parsedData.rekomendasi) {
          logEntry.decisionDetails.recommendations = parsedData.rekomendasi.map((rec, index) => ({
            action: rec,
            category: index < 2 ? 'immediate' : index < 4 ? 'preventive' : 'long_term',
            priority: parsedData.prioritas === 'high' ? 'high' : 'medium',
            estimatedTime: parsedData.estimasiWaktuPenyelesaian || '2-4 jam',
            technicalDetails: rec,
            successCriteria: 'Masalah teratasi dan metrik kembali normal'
          }));
        }
      }

      // Set performance metrics
      logEntry.performanceMetrics = {
        accuracy: performance.accuracy || 0.8,
        relevance: performance.relevance || 0.8,
        actionability: performance.actionability || 0.8,
        timeliness: performance.timeliness || 0.9
      };

      await logEntry.save();

      logger.debug('Alert analysis logging completed', { sessionId });
      return logEntry;

    } catch (error) {
      logger.logError('ALERT_ANALYSIS_LOGGING_COMPLETE_FAILED', error, { sessionId });
      throw error;
    }
  }

  /**
   * Memulai logging untuk recommendation generation
   */
  async startRecommendationLogging(serverId, userId, contextData) {
    try {
      const sessionId = this.createSessionId();

      const logEntry = new AIDecisionLog({
        sessionId,
        serverId,
        userId,
        decisionType: 'recommendation_generation',
        aiInput: {
          prompt: contextData.prompt,
          context: {
            serverInfo: contextData.serverInfo,
            metricsData: contextData.metricsData,
            alertHistory: contextData.alertHistory,
            userContext: contextData.userContext
          },
          parameters: {
            model: contextData.model || 'gpt-3.5-turbo',
            temperature: contextData.temperature || 0.3,
            maxTokens: contextData.maxTokens || 800,
            timestamp: new Date()
          }
        }
      });

      await logEntry.save();
      this.activeSessions.set(sessionId, logEntry._id);

      logger.debug('Recommendation logging started', { sessionId, serverId });
      return { sessionId, logId: logEntry._id };

    } catch (error) {
      logger.logError('RECOMMENDATION_LOGGING_START_FAILED', error, { serverId });
      throw error;
    }
  }

  /**
   * Menyelesaikan logging recommendation dengan output
   */
  async completeRecommendationLogging(sessionId, aiResponse, recommendations, performance) {
    try {
      const logEntry = await AIDecisionLog.findById(this.activeSessions.get(sessionId));
      if (!logEntry) {
        throw new Error(`Log entry not found for session ${sessionId}`);
      }

      logEntry.aiOutput = {
        rawResponse: aiResponse,
        parsedResponse: recommendations,
        confidence: performance.confidence,
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed
      };

      // Structure recommendations
      logEntry.decisionDetails.recommendations = recommendations.map((rec, index) => ({
        action: rec.action || rec,
        category: rec.category || (index < 2 ? 'immediate' : 'preventive'),
        priority: rec.priority || 'medium',
        estimatedTime: rec.estimatedTime || '2-4 jam',
        technicalDetails: rec.description || rec.action || rec,
        successCriteria: rec.successCriteria || 'Rekomendasi diimplementasikan dengan sukses'
      }));

      logEntry.performanceMetrics = {
        accuracy: performance.accuracy || 0.8,
        relevance: performance.relevance || 0.9,
        actionability: performance.actionability || 0.9,
        timeliness: performance.timeliness || 0.8
      };

      await logEntry.save();

      logger.debug('Recommendation logging completed', { sessionId });
      return logEntry;

    } catch (error) {
      logger.logError('RECOMMENDATION_LOGGING_COMPLETE_FAILED', error, { sessionId });
      throw error;
    }
  }

  /**
   * Memulai logging untuk chatbot interactions
   */
  async startChatbotLogging(userId, serverId, conversationContext) {
    try {
      const sessionId = this.createSessionId();

      const logEntry = new AIDecisionLog({
        sessionId,
        serverId,
        userId,
        decisionType: 'chatbot_response',
        aiInput: {
          prompt: conversationContext.userMessage,
          context: {
            conversationHistory: conversationContext.history,
            serverInfo: conversationContext.serverInfo,
            userContext: conversationContext.userContext
          },
          parameters: {
            model: conversationContext.model || 'gpt-3.5-turbo',
            temperature: conversationContext.temperature || 0.3,
            maxTokens: conversationContext.maxTokens || 500,
            timestamp: new Date()
          }
        }
      });

      await logEntry.save();
      this.activeSessions.set(sessionId, logEntry._id);

      logger.debug('Chatbot logging started', { sessionId, userId });
      return { sessionId, logId: logEntry._id };

    } catch (error) {
      logger.logError('CHATBOT_LOGGING_START_FAILED', error, { userId });
      throw error;
    }
  }

  /**
   * Menyelesaikan logging chatbot dengan response
   */
  async completeChatbotLogging(sessionId, aiResponse, responseMetadata, performance) {
    try {
      const logEntry = await AIDecisionLog.findById(this.activeSessions.get(sessionId));
      if (!logEntry) {
        throw new Error(`Log entry not found for session ${sessionId}`);
      }

      logEntry.aiOutput = {
        rawResponse: aiResponse,
        parsedResponse: responseMetadata,
        confidence: performance.confidence,
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed
      };

      // Chatbot specific details
      logEntry.decisionDetails.chatbotResponse = {
        intent: responseMetadata.intent,
        confidence: responseMetadata.confidence,
        responseType: responseMetadata.responseType,
        topics: responseMetadata.topics || []
      };

      logEntry.performanceMetrics = {
        accuracy: performance.accuracy || 0.8,
        relevance: performance.relevance || 0.9,
        actionability: performance.actionability || 0.7,
        timeliness: performance.timeliness || 0.95
      };

      await logEntry.save();

      logger.debug('Chatbot logging completed', { sessionId });
      return logEntry;

    } catch (error) {
      logger.logError('CHATBOT_LOGGING_COMPLETE_FAILED', error, { sessionId });
      throw error;
    }
  }

  /**
   * Menambah user interaction ke log
   */
  async addUserInteraction(logId, userId, action, details = {}, feedback = null) {
    try {
      const logEntry = await AIDecisionLog.findById(logId);
      if (!logEntry) {
        throw new Error(`Log entry not found: ${logId}`);
      }

      const interaction = {
        userId,
        action,
        timestamp: new Date(),
        details
      };

      if (feedback) {
        interaction.feedback = feedback;
      }

      logEntry.userInteractions.push(interaction);
      await logEntry.save();

      logger.debug('User interaction added to log', { logId, userId, action });
      return logEntry;

    } catch (error) {
      logger.logError('USER_INTERACTION_LOGGING_FAILED', error, { logId, userId, action });
      throw error;
    }
  }

  /**
   * Update outcome dari decision AI
   */
  async updateDecisionOutcome(logId, outcomeType, outcomeData) {
    try {
      const logEntry = await AIDecisionLog.findById(logId);
      if (!logEntry) {
        throw new Error(`Log entry not found: ${logId}`);
      }

      if (!logEntry.outcomes[outcomeType]) {
        logEntry.outcomes[outcomeType] = {};
      }

      Object.assign(logEntry.outcomes[outcomeType], outcomeData);
      logEntry.audit.updatedAt = new Date();

      await logEntry.save();

      logger.debug('Decision outcome updated', { logId, outcomeType });
      return logEntry;

    } catch (error) {
      logger.logError('DECISION_OUTCOME_UPDATE_FAILED', error, { logId, outcomeType });
      throw error;
    }
  }

  /**
   * Mark alert sebagai resolved
   */
  async markAlertResolved(logId, resolutionData) {
    try {
      const logEntry = await AIDecisionLog.findById(logId);
      if (!logEntry) {
        throw new Error(`Log entry not found: ${logId}`);
      }

      logEntry.outcomes.alertResolution = {
        resolved: true,
        resolvedAt: new Date(),
        ...resolutionData
      };

      logEntry.audit.updatedAt = new Date();
      await logEntry.save();

      logger.debug('Alert marked as resolved', { logId });
      return logEntry;

    } catch (error) {
      logger.logError('ALERT_RESOLUTION_LOGGING_FAILED', error, { logId });
      throw error;
    }
  }

  /**
   * Log error dalam AI processing
   */
  async logAIError(logId, errorType, errorMessage, recoveryAction = null) {
    try {
      const logEntry = await AIDecisionLog.findById(logId);
      if (!logEntry) {
        throw new Error(`Log entry not found: ${logId}`);
      }

      logEntry.errors.push({
        type: errorType,
        message: errorMessage,
        stackTrace: error.stack,
        timestamp: new Date(),
        recoveryAction
      });

      await logEntry.save();

      logger.debug('AI error logged', { logId, errorType });
      return logEntry;

    } catch (error) {
      logger.logError('AI_ERROR_LOGGING_FAILED', error, { logId, errorType });
      throw error;
    }
  }

  /**
   * Get analytics untuk evaluasi akademik
   */
  async getAnalytics(timeRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const analytics = await AIDecisionLog.getPerformanceMetrics(startDate, new Date());

      const totalLogs = await AIDecisionLog.countDocuments({
        'aiInput.parameters.timestamp': { $gte: startDate }
      });

      const unresolvedAlerts = await AIDecisionLog.getUnresolvedAlerts();

      return {
        totalLogs,
        performanceByType: analytics,
        unresolvedAlertsCount: unresolvedAlerts.length,
        timeRange: `${timeRange} days`
      };

    } catch (error) {
      logger.logError('ANALYTICS_GENERATION_FAILED', error);
      throw error;
    }
  }

  /**
   * Export data untuk research akademik
   */
  async exportForResearch(filters = {}, anonymize = true) {
    try {
      let query = {};

      if (filters.decisionType) query.decisionType = filters.decisionType;
      if (filters.serverId) query.serverId = filters.serverId;
      if (filters.dateRange) {
        query['aiInput.parameters.timestamp'] = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }

      const logs = await AIDecisionLog.find(query)
        .populate('serverId', 'nama jenisServer')
        .sort({ 'aiInput.parameters.timestamp': -1 })
        .limit(filters.limit || 1000);

      // Anonymize jika diminta
      if (anonymize) {
        logs.forEach(log => {
          if (log.userId) log.userId = `user_${log.userId.toString().slice(-8)}`;
          if (log.aiInput.context?.userContext) {
            delete log.aiInput.context.userContext;
          }
        });
      }

      return {
        exportDate: new Date(),
        totalRecords: logs.length,
        filters,
        anonymized: anonymize,
        data: logs
      };

    } catch (error) {
      logger.logError('RESEARCH_DATA_EXPORT_FAILED', error);
      throw error;
    }
  }

  /**
   * Cleanup old sessions
   */
  cleanupOldSessions(maxAgeHours = 24) {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    for (const [sessionId, logId] of this.activeSessions.entries()) {
      // Remove sessions older than cutoff
      if (this.activeSessions.get(sessionId) < cutoffTime) {
        this.activeSessions.delete(sessionId);
      }
    }

    logger.debug('Old sessions cleaned up', { remainingSessions: this.activeSessions.size });
  }
}

// Singleton instance
const aiLoggingService = new AIService();

// Periodic cleanup
setInterval(() => {
  aiLoggingService.cleanupOldSessions();
}, 60 * 60 * 1000); // Every hour

module.exports = aiLoggingService;