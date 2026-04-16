# Codex Review

## Scope

Review ini meliputi seluruh kandungan di `C:\Users\megat\.gemini\antigravity\brain\` berdasarkan inventori fail penuh, semakan struktur, analisis integriti pasangan artifact, dan pembacaan dokumen teras serta metadata berkaitan.

Tarikh review: `2026-04-12`

## Inventory Summary

- Jumlah fail: `626`
- Jumlah saiz: `~74.6 MB`
- Direktori sesi utama: `7`
- Direktori kosong: `7b9417a1-7bb6-42fc-9ddc-13fa0a057427`, `tempmediaStorage`

### Pecahan kategori

| Kategori | Bilangan | Saiz |
|---|---:|---:|
| Main markdown | 34 | ~0.38 MB |
| Metadata JSON | 34 | ~0.02 MB |
| Resolved files | 108 | ~1.00 MB |
| Browser scratchpads | 40 | ~0.02 MB |
| System step content | 23 | ~0.70 MB |
| Click feedback images | 37 | ~4.44 MB |
| Temp media storage | 343 | ~22.27 MB |
| Standalone images/videos | 31 | ~44.04 MB |

### Sesi terbesar

| Sesi | Bilangan fail | Saiz |
|---|---:|---:|
| `dea672ab-ba29-46ae-891d-8b2b35970650` | 448 | ~49.73 MB |
| `4013104e-05ce-46bc-a861-0673d24a06ea` | 50 | ~21.47 MB |
| `d6a232f0-826c-42bf-82ad-27d259cc30ed` | 89 | ~1.28 MB |

## Findings

### 1. Canonical source integrity ada gap sebenar

Ada sekurang-kurangnya satu dokumen utama yang hilang tetapi trail lain masih wujud:

- `a1918469-6f05-4b73-a074-852dda9805b2/full_project_audit.md` tiada
- Tetapi `full_project_audit.md.metadata.json` dan `full_project_audit.md.resolved` masih ada

Ini menunjukkan archive ini belum ada integrity check yang mengesan bila source artifact utama terpadam tetapi companion files masih tinggal. Kesan dia, knowledge boleh nampak “ada”, padahal primary document sudah hilang.

### 2. Brain ini sangat berat pada artefak sementara berbanding knowledge sebenar

Dokumen utama cuma `34` fail dengan saiz lebih kurang `0.38 MB`, tetapi temp media + image/video + click feedback mengambil majoriti ruang.

Ini bermaksud:

- Nilai knowledge sebenar tenggelam dalam artefak operasi
- Carian manual jadi sukar
- Backup dan sync menjadi mahal
- Signal-to-noise ratio rendah

### 3. Tiada manifest pusat atau canonical index yang hidup

Semua kandungan dipecah ikut UUID sesi, tetapi tiada fail indeks pusat seperti:

- `brain-index.json`
- `manifest.sqlite`
- `latest.md`
- `topics/`
- `artifacts-by-project/`

Akibatnya:

- UUID tidak self-describing
- Sukar tahu sesi mana paling penting
- Sukar trace hubungan antara `task.md`, `implementation_plan.md`, `walkthrough.md`, review, screenshot, dan temp DOM

### 4. Metadata schema terlalu nipis

Set metadata yang dijumpai sangat minimum. Kunci metadata yang wujud cuma:

- `artifactType`
- `summary`
- `updatedAt`
- `requestFeedback`
- `version`

Daripada `34` metadata files, cuma `9` ada field `version`.

Metadata penting yang belum ada:

- `sessionId`
- `projectRoot`
- `repo`
- `branch`
- `commitHash`
- `parentArtifact`
- `relatedArtifacts`
- `tags`
- `status`
- `reviewFreshness`
- `sourceUrls`
- `mediaLinks`
- `owner/agent`

Tanpa field-field ini, dokumen lama cepat hilang konteks dan sukar dinilai sama ada masih relevan atau sudah obsolete.

### 5. Beberapa review pusat sudah stale atau drift daripada realiti semasa

Contoh paling jelas:

- `brain_review.md` menyatakan scope `164 files total`, sedangkan inventori semasa ialah `626 files`
- Beberapa dokumen masih merujuk laluan lama seperti `g:/PROJECT-6/theviralfindsmy/...`
- Ada review lama yang jelas mengulas keadaan repo lama yang kini sudah berubah

Masalah utamanya bukan pada isi review itu sendiri, tetapi pada ketiadaan mekanisme “freshness”:

- tiada `as-of commit`
- tiada `supersededBy`
- tiada `validatedOn`
- tiada `current status`

Jadi pembaca baru sukar tahu mana review yang masih authoritative.

### 6. Canonical docs bercampur dengan operational traces

Dalam satu ruang yang sama, kita jumpa:

- review / audit
- task lists
- implementation plans
- walkthroughs
- scratchpads
- step captures
- click feedback screenshots
- DOM dumps
- temp media screenshots / recordings

Ini menjadikan folder `brain` lebih mirip raw execution log daripada knowledge base yang terurus. Ia masih berguna, tetapi belum cukup curated untuk jadi “brain” yang mudah dipakai semula.

### 7. Banyak duplication pada artifact variants

Pattern seperti berikut sangat kerap:

- `file.md`
- `file.md.metadata.json`
- `file.md.resolved`
- `file.md.resolved.0`
- `file.md.resolved.1`
- `file.md.resolved.2`

Ini baik untuk traceability, tetapi tanpa polisi lifecycle, duplication akan terus membesar. Dalam keadaan sekarang, resolved variants nampak disimpan sebagai first-class artifacts tanpa stratifikasi yang jelas antara:

- source canonical
- compiled / resolved output
- chunked intermediates

### 8. Ada orphan-ish knowledge nodes

Beberapa fail memang wujud, tetapi tiada metadata/resolved pair, contohnya:

- `a1918469-6f05-4b73-a074-852dda9805b2/Opus-Review.md`
- beberapa `browser/scratchpad_*.md`
- semua `.system_generated/steps/*/content.md`

Untuk scratchpad, ini mungkin normal. Tetapi untuk review seperti `Opus-Review.md`, ketiadaan metadata menjadikannya kurang discoverable dan kurang boleh dihubungkan dengan sistem arkib yang lain.

### 9. Archive ini patut dianggap sensitif

Sebahagian dokumen review menyentuh:

- `.env`
- auth
- gateway token risk
- local file links
- internal architecture

Walaupun saya tidak menyalin sebarang secret, kandungan jenis ini menunjukkan brain archive bukan sekadar note biasa. Ia patut dikendalikan sebagai sensitive internal knowledge.

## Data Yang Mungkin Tercicir

Ini ialah data paling berkemungkinan tercicir atau belum pernah ditangkap dengan baik:

- Source artifact utama untuk `a191.../full_project_audit.md`
- Hubungan parent-child antara review dengan screenshot/video yang menyokong review itu
- Commit hash atau snapshot repo bagi setiap audit
- Status semasa dokumen: `draft`, `final`, `executed`, `obsolete`, `superseded`
- Mapping antara `task.md` -> `implementation_plan.md` -> `walkthrough.md` -> `review.md`
- Topik / domain tags seperti `security`, `OpenClaw`, `Shopee`, `UI`, `VPS`
- Penanda “latest authoritative review” untuk satu projek
- Media provenance: screenshot itu diambil pada URL/route mana, dengan flow apa

## Improvement Suggestions

### Priority 1: Stabilize canonical knowledge

1. Wujudkan `brain-index.json` atau SQLite manifest di root.
2. Simpan satu record bagi setiap artifact dengan ID, jenis, sesi, projek, status, hash, dan related files.
3. Recover `a191.../full_project_audit.md` daripada `.resolved` dan tandakan sebagai recovered jika sesuai.
4. Tambah integrity checker yang semak:
   - source hilang
   - metadata hilang
   - broken pairs
   - empty session dirs

### Priority 2: Pisahkan canonical vs ephemeral

Asingkan struktur kepada:

- `canonical/` untuk review, audit, plan, walkthrough yang final
- `session-logs/` untuk task, scratchpad, step captures
- `media/` untuk image/video yang disahkan penting
- `cache/` untuk `.tempmediaStorage`, DOM dumps, click feedback

Dengan ini, search dan backup akan jadi jauh lebih bersih.

### Priority 3: Enrich metadata

Cadangan schema minimum:

```json
{
  "artifactType": "review|task|plan|walkthrough|step|scratchpad|media",
  "sessionId": "uuid",
  "project": "PROJECT-6",
  "projectRoot": "G:/PROJECT-6",
  "repo": "local",
  "branch": "main",
  "commitHash": "optional",
  "title": "Human title",
  "summary": "Short summary",
  "tags": ["openclaw", "security", "shopee"],
  "status": "draft|final|executed|obsolete|superseded",
  "supersededBy": "artifact-id",
  "relatedArtifacts": ["artifact-id-1", "artifact-id-2"],
  "mediaLinks": ["relative/path.png"],
  "createdAt": "ISO",
  "updatedAt": "ISO",
  "reviewFreshness": "historical|current|unknown",
  "sensitivity": "internal|sensitive"
}
```

### Priority 4: Add a “latest state” layer

Untuk projek aktif, simpan:

- `latest-review.md`
- `latest-plan.md`
- `latest-walkthrough.md`
- `latest-audit.json`

Ini elakkan pengguna perlu buka 4 versi `implementation_plan.md` dan 3 versi `walkthrough.md` untuk faham keadaan semasa.

### Priority 5: Retention policy untuk media

Saiz archive sangat didominasi oleh media. Cadangan:

- compress atau archive video besar selepas 30 hari
- delete DOM dumps / click feedback jika sudah linked ke final artifact
- simpan hanya “keeper screenshots” yang dirujuk oleh review
- move `.tempmediaStorage` ke cache path luar `brain`

### Priority 6: Add traceability between docs and evidence

Setiap review patut ada seksyen atau metadata:

- `Evidence`
- `Screenshots used`
- `Routes/URLs observed`
- `Source docs read`

Sekarang banyak media ada, tetapi hubungan dengan review induk tidak cukup eksplisit.

### Priority 7: Normalize naming

Gunakan nama artifact yang lebih konsisten, contohnya:

- `review-project.md`
- `review-ui-shopee-office.md`
- `plan-vps-migration.md`
- `walkthrough-shopee-api.md`

UUID sesi masih boleh dikekalkan, tetapi nama fail sepatutnya membantu carian tanpa perlu buka satu demi satu.

## Recommended Next Actions

1. Pulihkan `a191.../full_project_audit.md` daripada `.resolved`.
2. Tanda `Opus-Review.md` dengan metadata lengkap.
3. Bina manifest pusat untuk semua artifact sedia ada.
4. Asingkan `cache/temp media` daripada `canonical knowledge`.
5. Tambah freshness markers supaya review lama tidak disalah anggap sebagai current state.
6. Buat satu `LATEST.md` untuk projek `PROJECT-6` yang merujuk artifact paling authoritative.

## Overall Verdict

Brain archive ini **kaya dengan bahan**, tetapi belum cukup kemas untuk jadi knowledge system yang stabil dan boleh dipercayai pada jangka panjang.

Secara ringkas:

- **Strength**: banyak review bernilai tinggi, walkthrough terperinci, evidence visual lengkap, dan sesi-sesi penting masih boleh dikesan
- **Weakness**: terlalu banyak cache/media bercampur dengan dokumen utama, metadata terlalu nipis, tiada manifest pusat, dan sekurang-kurangnya satu source artifact sudah hilang

Kalau diurus semula dengan manifest, retention policy, dan schema metadata yang lebih matang, folder ini boleh naik daripada “history dump” kepada **project memory system** yang betul-betul advanced.
