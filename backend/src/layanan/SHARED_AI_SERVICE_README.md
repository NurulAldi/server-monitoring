# Shared AI Service - Sistem Monitoring Server

## Overview

Shared AI Service adalah komponen terpusat yang menyatukan konteks dan logika antara AI Chatbot dan AI Rekomendasi Email. Sistem ini memastikan konsistensi dalam analisis kesehatan server, terminologi, dan rekomendasi yang diberikan.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared AI Service Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AI Chatbot  │  │ AI Email    │  │ Shared Components   │  │
│  │ Service     │  │ Analysis    │  │                     │  │
│  │             │  │             │  │ • AI Engine Core     │  │
│  └─────────────┘  └─────────────┘  │ • Knowledge Base     │  │
│                                    │ • Prompt Manager      │  │
├────────────────────────────────────┼─────────────────────┤
│         Unified Context & Logic    │ • Context Builder    │  │
│                                    │ • Response Validator │  │
│ • Consistent Server Health         │ • Monitoring         │  │
│ • Unified Thresholds & Rules       │                     │  │
│ • Standardized Terminology         │                     │  │
└────────────────────────────────────┴─────────────────────┘
```

## Komponen Utama

### 1. Shared AI Engine Core
- **Tujuan**: Titik entry tunggal untuk semua interaksi OpenAI API
- **Fitur**:
  - Konfigurasi AI yang konsisten (model, temperature, max_tokens)
  - Error handling terstandardisasi
  - Logging terpusat untuk monitoring
  - Retry mechanism untuk reliability

### 2. Unified Knowledge Base
- **Server Health Ontology**: Definisi parameter kesehatan server (CPU, Memory, Disk, Network)
- **Severity Levels**: Kategori severity yang konsisten (Normal, Warning, Critical, Danger)
- **Business Rules**: Threshold dan rekomendasi yang sama untuk semua AI operations
- **Terminology**: Istilah teknis yang standardized

### 3. Centralized Prompt Manager
- **System Prompts**: Template prompt sistem yang dapat digunakan ulang
- **User Prompt Templates**: Template untuk berbagai jenis analisis
- **Context Injection**: Mekanisme konsisten untuk inject konteks server
- **Versioning**: Tracking perubahan prompt untuk consistency

### 4. Unified Context Builder
- **Chatbot Context**: Format data yang optimized untuk interaksi user
- **Email Alert Context**: Struktur data untuk analisis alert otomatis
- **General Analysis Context**: Context untuk analisis maintenance rutin
- **Data Formatting**: Standardisasi format metrik dan historis data

### 5. Response Validator & Standardizer
- **Chatbot Response Validation**: Memastikan format dan struktur response chatbot
- **Email Analysis Validation**: Validasi JSON response untuk email alerts
- **Fallback Mechanisms**: Response default jika AI gagal
- **Quality Assurance**: Konsistensi dalam tone dan terminology

## Parameter Kesehatan Server

| Parameter | Unit | Normal | Warning | Critical | Deskripsi |
|-----------|------|--------|---------|----------|-----------|
| CPU | % | 0-70 | 70-85 | 85-100 | Penggunaan CPU server |
| Memory | % | 0-75 | 75-88 | 88-100 | Penggunaan RAM server |
| Disk | % | 0-80 | 80-90 | 90-100 | Penggunaan storage disk |
| Network | MB/s | 0-50 | 50-100 | 100+ | Kecepatan transfer jaringan |

## Severity Levels

- **Normal**: Kondisi optimal, tidak perlu tindakan
- **Warning**: Perlu monitoring intensif, persiapkan tindakan
- **Critical**: Perlu tindakan segera untuk mencegah downtime
- **Danger**: Risiko tinggi downtime, tindakan emergency diperlukan

## Implementasi Konsistensi

### 1. Terminology Consistency
```javascript
// Contoh: Istilah yang sama digunakan di semua komponen
const terminology = {
  cpu: 'CPU Usage',
  memory: 'Memory Usage',
  high: 'tinggi',
  critical: 'kritis',
  recommendation: 'rekomendasi'
};
```

### 2. Threshold Consistency
```javascript
// Threshold yang sama untuk semua AI operations
const thresholds = {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 75, critical: 88 },
  disk: { warning: 80, critical: 90 }
};
```

### 3. Response Format Consistency
```javascript
// Format JSON yang sama untuk email analysis
const emailResponseFormat = {
  analisis: 'string',
  penyebabMungkin: ['array'],
  rekomendasi: ['array'],
  prioritas: 'high|medium|low',
  estimasiWaktuPenyelesaian: 'string'
};
```

## Manfaat Implementasi

### ✅ Konsistensi Jawaban
- AI Chatbot dan Email memberikan analisis yang sama untuk kondisi serupa
- Terminologi teknis yang konsisten
- Rekomendasi yang tidak conflicting

### ✅ Maintenance Efficiency
- Perubahan knowledge base cukup dilakukan di satu tempat
- Update prompt terpusat
- Testing yang lebih efisien

### ✅ Quality Assurance
- Validasi response otomatis
- Fallback mechanisms yang reliable
- Monitoring dan logging terpusat

### ✅ User Experience
- Tidak ada confusion dari AI yang berbeda pendapat
- Response yang predictable dan reliable
- Trust yang lebih tinggi pada sistem AI

## Testing

Jalankan test untuk memverifikasi konsistensi:

```bash
npm test -- --testPathPattern=sharedAIService.test.js
```

Test mencakup:
- ✅ Knowledge base consistency
- ✅ Prompt template rendering
- ✅ Context building accuracy
- ✅ Response validation
- ✅ Integration between components

## Usage Examples

### Chatbot Analysis
```javascript
const { buildContext, renderPrompt, executeAICompletion } = require('./sharedAIService');

const context = await buildContext('chatbot', serverId, metrics, userQuestion);
const prompt = renderPrompt('serverAnalysis', context);
const result = await executeAICompletion([...], { temperature: 0.3 });
```

### Email Alert Analysis
```javascript
const context = await buildContext('emailAlert', alertData);
const prompt = renderPrompt('alertRecommendation', context);
const result = await executeAICompletion([...], { temperature: 0.3 });
const validation = validateResponse('emailAnalysis', result.response);
```

## Future Enhancements

1. **Machine Learning Models**: Training custom models untuk analisis server
2. **Dynamic Thresholds**: Threshold yang adaptif berdasarkan historical data
3. **Multi-language Support**: Support untuk bahasa selain Indonesia
4. **Advanced Context**: Integration dengan external data sources
5. **Performance Optimization**: Caching dan optimization untuk high-throughput

## Troubleshooting

### Common Issues

1. **Inconsistent Responses**
   - Check jika semua komponen menggunakan shared service
   - Verify knowledge base updates
   - Check prompt template versions

2. **Validation Failures**
   - Review response format requirements
   - Check JSON parsing for email responses
   - Verify fallback mechanisms

3. **Performance Issues**
   - Monitor AI API usage
   - Check caching implementation
   - Optimize context building

### Monitoring

- **AI Usage Metrics**: Track token consumption dan response times
- **Error Rates**: Monitor failure rates untuk different AI operations
- **Consistency Checks**: Automated tests untuk verify consistency
- **User Feedback**: Collect feedback untuk continuous improvement

## Conclusion

Shared AI Service memastikan bahwa AI Chatbot dan AI Rekomendasi Email bekerja sebagai sistem yang kohesif, memberikan analisis yang konsisten, akurat, dan dapat diandalkan untuk mendukung pengambilan keputusan tim IT dalam monitoring kesehatan server.