// Model untuk logging keputusan AI dalam sistem monitoring server
// Mendukung evaluasi akademik dan analisis performa AI

const mongoose = require('mongoose');

const aiDecisionLogSchema = new mongoose.Schema({
  // Identitas dan konteks
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    index: true
  },
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pengguna',
    index: true
  },

  // Tipe keputusan AI
  decisionType: {
    type: String,
    enum: ['alert_analysis', 'recommendation_generation', 'chatbot_response', 'predictive_analysis'],
    required: true,
    index: true
  },

  // Input AI
  aiInput: {
    prompt: {
      type: String,
      required: true
    },
    context: {
      serverInfo: mongoose.Schema.Types.Mixed,
      metricsData: mongoose.Schema.Types.Mixed,
      historicalData: mongoose.Schema.Types.Mixed,
      userContext: mongoose.Schema.Types.Mixed
    },
    parameters: {
      model: String,
      temperature: Number,
      maxTokens: Number,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  },

  // Output AI
  aiOutput: {
    rawResponse: {
      type: String,
      required: true
    },
    parsedResponse: mongoose.Schema.Types.Mixed, // JSON structure
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    processingTime: Number, // dalam milliseconds
    tokensUsed: {
      prompt: Number,
      completion: Number,
      total: Number
    }
  },

  // Keputusan spesifik berdasarkan tipe
  decisionDetails: {
    // Untuk alert analysis
    alertAnalysis: {
      severityPredicted: {
        type: String,
        enum: ['normal', 'warning', 'critical', 'danger']
      },
      rootCause: [String],
      impactAssessment: {
        technical: String,
        business: String,
        urgency: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical']
        }
      }
    },

    // Untuk recommendations
    recommendations: [{
      action: {
        type: String,
        required: true
      },
      category: {
        type: String,
        enum: ['immediate', 'preventive', 'long_term'],
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      estimatedTime: String,
      technicalDetails: String,
      successCriteria: String
    }],

    // Untuk chatbot responses
    chatbotResponse: {
      intent: String,
      confidence: Number,
      responseType: {
        type: String,
        enum: ['informational', 'actionable', 'clarification', 'error']
      },
      topics: [String]
    }
  },

  // User interaction tracking
  userInteractions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pengguna'
    },
    action: {
      type: String,
      enum: ['viewed', 'acknowledged', 'followed_recommendation', 'overrode_decision', 'provided_feedback'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed, // additional context
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      helpfulness: {
        type: String,
        enum: ['not_helpful', 'somewhat_helpful', 'very_helpful', 'critical']
      }
    }
  }],

  // Outcome tracking
  outcomes: {
    alertResolution: {
      resolved: Boolean,
      resolutionTime: Number, // dalam minutes
      resolutionMethod: {
        type: String,
        enum: ['followed_ai_recommendation', 'manual_intervention', 'automated_recovery', 'escalated']
      },
      actualRootCause: String,
      lessonsLearned: String
    },

    recommendationEffectiveness: [{
      recommendationIndex: Number,
      implemented: Boolean,
      implementationTime: Date,
      success: Boolean,
      impact: {
        technical: String,
        business: String,
        costSavings: Number
      },
      feedback: String
    }],

    systemImpact: {
      preventedDowntime: Boolean,
      estimatedDowntimeSaved: Number, // dalam minutes
      costAvoided: Number,
      userExperience: {
        type: String,
        enum: ['improved', 'unchanged', 'degraded']
      }
    }
  },

  // Performance metrics
  performanceMetrics: {
    accuracy: {
      type: Number,
      min: 0,
      max: 1
    },
    relevance: {
      type: Number,
      min: 0,
      max: 1
    },
    actionability: {
      type: Number,
      min: 0,
      max: 1
    },
    timeliness: {
      type: Number,
      min: 0,
      max: 1
    }
  },

  // Error tracking
  errors: [{
    type: {
      type: String,
      enum: ['api_error', 'parsing_error', 'validation_error', 'timeout', 'fallback_activated']
    },
    message: String,
    stackTrace: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    recoveryAction: String
  }],

  // Metadata untuk evaluasi akademik
  academicMetadata: {
    researchFlags: {
      novelApproach: Boolean,
      requiresReview: Boolean,
      highImpact: Boolean,
      userStudyCandidate: Boolean
    },

    experimentContext: {
      experimentId: String,
      variant: String,
      controlGroup: Boolean,
      hypothesis: String
    },

    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 1
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 1
      },
      timeliness: {
        type: Number,
        min: 0,
        max: 1
      }
    }
  },

  // Audit trail
  audit: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    },
    source: {
      type: String,
      enum: ['alert_system', 'chatbot', 'api', 'manual'],
      default: 'alert_system'
    }
  }
}, {
  timestamps: true,
  collection: 'ai_decision_logs'
});

// Indexes untuk performa query
aiDecisionLogSchema.index({ 'aiInput.parameters.timestamp': -1 });
aiDecisionLogSchema.index({ decisionType: 1, serverId: 1 });
aiDecisionLogSchema.index({ userId: 1, 'userInteractions.timestamp': -1 });
aiDecisionLogSchema.index({ 'outcomes.alertResolution.resolved': 1 });
aiDecisionLogSchema.index({ 'academicMetadata.researchFlags.novelApproach': 1 });

// Virtual untuk computed fields
aiDecisionLogSchema.virtual('isResolved').get(function() {
  return this.outcomes?.alertResolution?.resolved || false;
});

aiDecisionLogSchema.virtual('resolutionTimeMinutes').get(function() {
  return this.outcomes?.alertResolution?.resolutionTime || null;
});

aiDecisionLogSchema.virtual('userSatisfaction').get(function() {
  const feedbacks = this.userInteractions
    .filter(interaction => interaction.feedback?.rating)
    .map(interaction => interaction.feedback.rating);

  if (feedbacks.length === 0) return null;
  return feedbacks.reduce((sum, rating) => sum + rating, 0) / feedbacks.length;
});

// Instance methods
aiDecisionLogSchema.methods.addUserInteraction = function(userId, action, details = {}) {
  this.userInteractions.push({
    userId,
    action,
    timestamp: new Date(),
    details
  });
  return this.save();
};

aiDecisionLogSchema.methods.addFeedback = function(userId, feedback) {
  const interaction = this.userInteractions.find(
    i => i.userId.toString() === userId.toString() &&
    i.action === 'provided_feedback'
  );

  if (interaction) {
    interaction.feedback = { ...interaction.feedback, ...feedback };
  } else {
    this.userInteractions.push({
      userId,
      action: 'provided_feedback',
      timestamp: new Date(),
      feedback
    });
  }
  return this.save();
};

aiDecisionLogSchema.methods.updateOutcome = function(outcomeType, data) {
  if (!this.outcomes[outcomeType]) {
    this.outcomes[outcomeType] = {};
  }
  Object.assign(this.outcomes[outcomeType], data);
  this.audit.updatedAt = new Date();
  return this.save();
};

aiDecisionLogSchema.methods.markAsResolved = function(resolutionData) {
  this.outcomes.alertResolution = {
    resolved: true,
    ...resolutionData,
    resolvedAt: new Date()
  };
  this.audit.updatedAt = new Date();
  return this.save();
};

// Static methods untuk queries akademik
aiDecisionLogSchema.statics.getByDateRange = function(startDate, endDate) {
  return this.find({
    'aiInput.parameters.timestamp': {
      $gte: startDate,
      $lte: endDate
    }
  });
};

aiDecisionLogSchema.statics.getByDecisionType = function(decisionType, limit = 100) {
  return this.find({ decisionType })
    .sort({ 'aiInput.parameters.timestamp': -1 })
    .limit(limit);
};

aiDecisionLogSchema.statics.getByServer = function(serverId, limit = 50) {
  return this.find({ serverId })
    .sort({ 'aiInput.parameters.timestamp': -1 })
    .limit(limit);
};

aiDecisionLogSchema.statics.getUnresolvedAlerts = function() {
  return this.find({
    decisionType: 'alert_analysis',
    'outcomes.alertResolution.resolved': { $ne: true }
  });
};

aiDecisionLogSchema.statics.getPerformanceMetrics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'aiInput.parameters.timestamp': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$decisionType',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$aiOutput.processingTime' },
        avgConfidence: { $avg: '$aiOutput.confidence' },
        avgAccuracy: { $avg: '$performanceMetrics.accuracy' },
        totalTokens: { $sum: '$aiOutput.tokensUsed.total' },
        resolvedCount: {
          $sum: { $cond: ['$outcomes.alertResolution.resolved', 1, 0] }
        }
      }
    }
  ]);
};

aiDecisionLogSchema.statics.getUserEngagementStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        'aiInput.parameters.timestamp': { $gte: startDate, $lte: endDate }
      }
    },
    {
      $unwind: '$userInteractions'
    },
    {
      $group: {
        _id: '$userInteractions.action',
        count: { $sum: 1 },
        avgRating: { $avg: '$userInteractions.feedback.rating' }
      }
    }
  ]);
};

const AIDecisionLog = mongoose.model('AIDecisionLog', aiDecisionLogSchema);

module.exports = AIDecisionLog;