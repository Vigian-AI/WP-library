# WP-Library Use Case Diagrams

Dokumen ini berisi diagram use case Mermaid untuk aktor user dan admin pada sistem WP-Library.

## Use Case Diagram - User

```mermaid
flowchart LR
    User([User])

    UC1((Login))
    UC2((Lihat katalog buku))
    UC3((Lihat detail buku))
    UC4((Ajukan peminjaman))
    UC5((Lihat pinjaman aktif))
    UC6((Perpanjang pinjaman))
    UC7((Kembalikan buku))
    UC8((Kelola wishlist))
    UC9((Kelola profil))

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
```

## Use Case Diagram - Admin

```mermaid
flowchart LR
    Admin([Admin])

    AC1((Login))
    AC2((Lihat dashboard))
    AC3((Kelola buku))
    AC4((Kelola kategori))
    AC5((Kelola user))
    AC6((Lihat permintaan peminjaman))
    AC7((Approve peminjaman))
    AC8((Reject peminjaman))
    AC9((Lihat pinjaman aktif))
    AC10((Lihat pinjaman terlambat))
    AC11((Kirim reminder))
    AC12((Lihat laporan))
    AC13((Kelola system settings))

    Admin --> AC1
    Admin --> AC2
    Admin --> AC3
    Admin --> AC4
    Admin --> AC5
    Admin --> AC6
    Admin --> AC7
    Admin --> AC8
    Admin --> AC9
    Admin --> AC10
    Admin --> AC11
    Admin --> AC12
    Admin --> AC13
```

## Catatan

- Mermaid tidak punya sintaks use case diagram UML yang benar-benar native, jadi diagram di atas dibuat dengan `flowchart` dan node berbentuk oval untuk merepresentasikan use case.
- Jika diperlukan, saya bisa gabungkan use case ini ke [MERMAID_ACTIVITY_DIAGRAMS.md](MERMAID_ACTIVITY_DIAGRAMS.md) atau tambahkan diagram untuk aktor lain seperti guest atau super admin.