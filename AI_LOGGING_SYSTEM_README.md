# Sistem Logging AI untuk Evaluasi Akademik

## Overview

Sistem logging AI ini dirancang untuk mendukung evaluasi akademik efektivitas Artificial Intelligence dalam sistem monitoring server kesehatan. Sistem ini mencatat semua interaksi AI, performa, dan outcome untuk analisis komprehensif.

## Arsitektur Sistem

### Komponen Utama

1. **AIDecisionLog Model** (`backend/src/model/AIDecisionLog.js`)
   - Database schema untuk menyimpan log keputusan AI
   - Mendukung metadata akademik dan research flags
   - Index untuk performa query yang optimal

2. **AILoggingService** (`backend/src/layanan/aiLoggingService.js`)
   - Service layer untuk mengelola semua operasi logging
   - Session management untuk tracking interaksi AI
   - Analytics dan export untuk penelitian

3. **AI Analytics API** (`backend/src/kontroler/kontrolerAILogging.js`)
   - RESTful endpoints untuk mengakses analytics
   - Endpoint untuk evaluasi akademik
   - Export data dalam format yang sesuai untuk penelitian

### Tipe Keputusan AI yang Dilacak

- `alert_analysis`: Analisis kondisi server untuk alert email
- `chatbot_response`: Response AI chatbot kepada user
- `server_analysis`: Analisis mendalam kondisi server
- `recommendation_generation`: Pembuatan rekomendasi perbaikan

## API Endpoints

### Analytics Summary
```
GET /api/ai-analytics/summary
```
Mendapatkan ringkasan analytics AI untuk periode tertentu.

**Query Parameters:**
- `startDate`: Tanggal mulai (ISO string)
- `endDate`: Tanggal akhir (ISO string)
- `serverId`: Filter berdasarkan server
- `userId`: Filter berdasarkan user
- `aiType`: Filter berdasarkan tipe AI

### Performance Metrics
```
GET /api/ai-analytics/performance-metrics
```
Metrics performa AI (accuracy, response time, dll).

**Query Parameters:**
- `startDate`, `endDate`: Periode analisis
- `aiType`: Tipe AI yang dianalisis
- `groupBy`: Grouping (day/hour/month)

### User Interaction Analysis
```
GET /api/ai-analytics/user-interactions
```
Analisis pola interaksi user dengan AI.

**Query Parameters:**
- `startDate`, `endDate`: Periode analisis
- `userId`: User spesifik
- `interactionType`: Tipe interaksi

### Alert Analysis Effectiveness
```
GET /api/ai-analytics/alert-analysis-effectiveness
```
Mengukur efektivitas analisis AI dalam alert system.

### Research Data Export
```
GET /api/ai-analytics/research-export
```
Export data lengkap untuk penelitian akademik.

**Query Parameters:**
- `startDate`, `endDate`: Periode export
- `format`: Format export (json/csv)
- `includeMetadata`: Sertakan metadata research

### Log Detail
```
GET /api/ai-analytics/logs/:logId
```
Mendapatkan detail log AI tertentu.

### Update Outcome
```
POST /api/ai-analytics/logs/:logId/outcome
```
Update outcome dari interaksi AI untuk evaluasi.

**Body:**
```json
{
  "outcome": "alert_resolution",
  "feedback": "User feedback",
  "resolvedIssues": ["Issue 1", "Issue 2"],
  "userSatisfaction": 4.5
}
```

### Comparative Analysis
```
GET /api/ai-analytics/comparative-analysis
```
Analisis komparatif performa AI vs manual monitoring.

## Struktur Data Log

### AI Input
```javascript
{
  prompt: "User prompt or analysis request",
  context: {
    serverInfo: { /* Server details */ },
    metricsData: { /* Current metrics */ },
    historicalData: { /* Historical data */ },
    userContext: { /* User context */ }
  },
  parameters: {
    model: "gpt-3.5-turbo",
    temperature: 0.3,
    maxTokens: 1000,
    timestamp: "2024-01-01T00:00:00Z"
  }
}
```

### AI Output
```javascript
{
  rawResponse: "Raw AI response",
  parsedResponse: { /* Structured response */ },
  confidence: 0.85,
  processingTime: 1250, // ms
  tokensUsed: { total: 450, prompt: 200, completion: 250 }
}
```

### Performance Metrics
```javascript
{
  accuracy: 0.85,      // Akurasi analisis/diagnosis
  relevance: 0.90,     // Relevansi response terhadap query
  actionability: 0.80, // Kemampuan action dari rekomendasi
  timeliness: 0.95     // Ketepatan waktu response
}
```

### Decision Details
```javascript
{
  alertAnalysis: {
    severityPredicted: "critical",
    rootCause: ["High CPU usage", "Memory leak"],
    impactAssessment: {
      technical: "Server performance degradation",
      business: "Service unavailability",
      urgency: "high"
    }
  },
  recommendations: [
    {
      action: "Restart application service",
      category: "immediate",
      priority: "high",
      estimatedTime: "5-10 minutes",
      technicalDetails: "Graceful restart to clear memory leaks",
      successCriteria: "Memory usage drops below 80%"
    }
  ]
}
```

### User Interactions
```javascript
[
  {
    userId: "user123",
    action: "email_opened",
    timestamp: "2024-01-01T00:05:00Z",
    details: { emailId: "alert123" },
    feedback: {
      satisfaction: 4,
      usefulness: 5,
      accuracy: 4,
      comments: "Helpful analysis"
    }
  }
]
```

### Outcomes
```javascript
{
  alertResolution: {
    resolved: true,
    resolvedAt: "2024-01-01T00:30:00Z",
    resolutionTime: 1800000, // ms
    method: "ai_recommended_action",
    userFeedback: "Issue resolved successfully"
  },
  userFeedback: {
    satisfaction: 4.5,
    wouldRecommend: true,
    additionalComments: "AI analysis was accurate"
  }
}
```

## Research Flags

Log entries dapat ditandai untuk keperluan penelitian:

```javascript
{
  academicResearch: true,
  caseStudy: "memory_leak_detection",
  experimentId: "exp_2024_q1",
  researchQuestions: [
    "How accurate is AI in detecting root causes?",
    "What is the impact on resolution time?"
  ],
  dataRetention: "5_years",
  anonymizeForPublication: true
}
```

## Analytics dan Metrics

### Key Performance Indicators (KPIs)

1. **Detection Accuracy**: Akurasi AI dalam mendeteksi masalah server
2. **Response Time**: Waktu yang dibutuhkan AI untuk memberikan analisis
3. **Resolution Time**: Waktu dari alert sampai masalah teratasi
4. **User Satisfaction**: Tingkat kepuasan user terhadap AI analysis
5. **False Positive Rate**: Tingkat alert palsu yang dihasilkan AI
6. **Action Success Rate**: Persentase rekomendasi AI yang berhasil

### Comparative Analysis

Sistem menyediakan analisis komparatif antara:
- **AI-powered monitoring**: Deteksi dan analisis otomatis
- **Manual monitoring**: Monitoring tradisional oleh manusia

Metrics perbandingan:
- Detection rate improvement
- Mean time to resolution (MTTR)
- False positive reduction
- User satisfaction scores

## Penggunaan untuk Evaluasi Akademik

### 1. Data Collection
- Semua interaksi AI secara otomatis dicatat
- Metadata akademik dapat ditambahkan pada log entries
- Export data dalam format yang sesuai untuk analisis statistik

### 2. Performance Analysis
- Track accuracy dan reliability dari waktu ke waktu
- Identifikasi pola kesalahan dan area improvement
- Measure impact terhadap operational efficiency

### 3. User Experience Research
- Analisis satisfaction dan feedback dari users
- Study adoption patterns dan usage behavior
- Evaluate effectiveness dari different AI approaches

### 4. Comparative Studies
- Bandingkan performa AI vs human experts
- Measure cost-benefit dari AI implementation
- Study learning curves dan improvement over time

## Keamanan dan Privacy

- **Data Anonymization**: Opsi untuk meng-anonymize data untuk publikasi
- **Access Control**: Role-based access (admin, researcher)
- **Audit Trail**: Semua akses ke data dicatat
- **Data Retention**: Kebijakan retention yang dapat dikonfigurasi

## Integration dengan Sistem Existing

Logging AI terintegrasi dengan:

1. **Alert System** (`layananAlert.js`): Otomatis log setiap analisis alert
2. **Chatbot AI** (`layananChatbotAI.js`): Log semua interaksi user
3. **AI Analysis Service** (`layananAi.js`): Log analisis kondisi server
4. **Shared AI Service** (`sharedAIService.js`): Konsistensi AI responses

## Maintenance dan Monitoring

### Automated Tasks
- Cleanup sessions lama setiap jam
- Archive old logs berdasarkan retention policy
- Generate periodic analytics reports

### Monitoring
- Track storage usage dari log data
- Monitor performance dari logging operations
- Alert jika logging system mengalami issues

## Future Enhancements

1. **Machine Learning Integration**: Gunakan logged data untuk improve AI models
2. **Real-time Analytics**: Dashboard real-time untuk monitoring AI performance
3. **A/B Testing Framework**: Test different AI approaches
4. **Advanced Analytics**: Predictive analytics berdasarkan historical data
5. **Integration dengan Tools Akademik**: Export ke R, Python, SPSS, etc.

## Troubleshooting

### Common Issues

1. **High Storage Usage**: Configure data retention policies
2. **Performance Degradation**: Check database indexes
3. **Missing Logs**: Verify service integration
4. **Export Failures**: Check memory limits untuk large datasets

### Debug Mode
Enable debug logging untuk troubleshooting:
```javascript
process.env.AI_LOGGING_DEBUG = 'true'
```

---

*Dokumen ini dibuat untuk mendukung evaluasi akademik sistem AI monitoring server kesehatan.*