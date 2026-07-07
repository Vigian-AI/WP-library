# WP-Library Activity Diagrams

Dokumen ini berisi diagram Mermaid untuk alur aktivitas user dan admin pada sistem WP-Library.

## User Activity Diagram

```mermaid
flowchart TD
    A([Mulai]) --> B[Login ke aplikasi]
    B --> C{Login berhasil?}
    C -- Tidak --> B
    C -- Ya --> D[Lihat katalog buku]
    D --> E[Pilih buku]
    E --> F{Stok tersedia?}
    F -- Tidak --> D
    F -- Ya --> G[Ajukan peminjaman]
    G --> H[Status: pending]
    H --> I[Menunggu persetujuan admin]
    I --> J{Disetujui admin?}
    J -- Tidak --> K[Status: rejected]
    K --> L[Selesai]
    J -- Ya --> M[Status: active]
    M --> N[Gunakan buku]
    N --> O[Perpanjang pinjaman?]
    O --> P{Butuh perpanjangan?}
    P -- Ya --> Q[Ajukan perpanjangan]
    Q --> R{Masih ada kuota perpanjangan?}
    R -- Tidak --> N
    R -- Ya --> S[Jatuh tempo diperbarui]
    S --> N
    P -- Tidak --> T[Kembalikan buku]
    T --> U{Terlambat?}
    U -- Ya --> V[Hitung denda]
    U -- Tidak --> W[Status: returned]
    V --> W
    W --> L
```

## Admin Activity Diagram

```mermaid
flowchart TD
    A([Mulai]) --> B[Login sebagai admin]
    B --> C{Akses valid?}
    C -- Tidak --> B
    C -- Ya --> D[Buka dashboard admin]
    D --> E[Lihat permintaan peminjaman]
    E --> F{Ada request pending?}
    F -- Tidak --> G[Kelola buku / user / laporan]
    F -- Ya --> H[Pilih request]
    H --> I{Approve atau reject?}
    I -- Approve --> J[Status loan: active]
    J --> K[Stok buku berkurang]
    I -- Reject --> L[Status loan: rejected]
    L --> M[Kirim notifikasi ke user]
    K --> N[Monitor pinjaman aktif]
    G --> N
    N --> O[Setel reminder / denda / batas pinjam]
    O --> P{Ada aksi lain?}
    P -- Ya --> D
    P -- Tidak --> Q([Selesai])
```

## Catatan

- Diagram di atas menggunakan Mermaid `flowchart` untuk mewakili activity diagram.
- Jika dibutuhkan, file ini bisa dipisah lagi menjadi diagram lebih detail untuk proses login, borrowing, approval, atau return.