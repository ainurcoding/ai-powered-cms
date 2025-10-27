# Contoh Translation Indonesia ke Inggris

## Input dalam Bahasa Indonesia

```typescript
const request: IContentGenerationRequest = {
    title: "Cara Belajar Pemrograman JavaScript",
    topic: "Pemrograman JavaScript untuk Pemula", 
    keywords: ["pemrograman", "javascript", "belajar coding", "web development", "tutorial"],
    contentType: 'blog',
    tone: 'friendly',
    length: 'medium',
    language: 'en'  // Output dalam bahasa Inggris
};
```

## Translation yang Akan Terjadi

### Topic Translation:
- "Pemrograman JavaScript untuk Pemula" → "programming javascript untuk pemula"

### Keywords Translation:
- "pemrograman" → "programming"
- "javascript" → "javascript" (sudah bahasa Inggris)
- "belajar coding" → "learning coding"
- "web development" → "web development" (sudah bahasa Inggris)
- "tutorial" → "tutorial" (sudah bahasa Inggris)

## Output yang Dihasilkan

AI akan menghasilkan konten blog bahasa Inggris tentang "JavaScript Programming for Beginners" dengan keywords yang sudah diterjemahkan.

## Contoh Penggunaan Lain

### Input Indonesia → Output Inggris:

```typescript
// Input: "Tips Optimasi Performansi Website"
// Output: "Website Performance Optimization Tips"

// Input: ["keamanan", "debugging", "testing", "deployment"]
// Output: ["security", "debugging", "testing", "deployment"]

// Input: "Panduan Lengkap React Native"
// Output: "Complete React Native Guide"
```

## Fitur Translation yang Tersedia

Sistem translation mendukung 50+ kata kunci teknis umum:
- Pemrograman → Programming
- Pengembangan → Development
- Belajar → Learning
- Tutorial → Tutorial
- Tips → Tips
- Dan banyak lagi...

## Cara Menggunakan

1. Set `language: 'en'` dalam request
2. Masukkan topic dan keywords dalam bahasa Indonesia
3. Sistem akan otomatis translate dan generate konten bahasa Inggris
4. Hasil akan berupa konten berkualitas tinggi dalam bahasa Inggris
