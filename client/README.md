# WP-Library — Client Documentation

Frontend aplikasi perpustakaan digital, dibangun dengan **React + Vite + Tailwind CSS**.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React | v19 | UI library |
| Vite | v8 | Build tool & dev server |
| React Router | v7 | Client-side routing |
| Axios | v1 | HTTP client |
| Tailwind CSS | v4 | Utility-first CSS |
| react-icons | v5.5 | Icon library (Material Design) |

---

## Struktur Folder

```
client/
├── src/
│   ├── assets/              # Gambar & aset statis
│   ├── components/          # Komponen reusable
│   │   ├── AuthorCard.jsx
│   │   ├── BookCard.jsx     # Kartu buku di grid catalog
│   │   ├── Button.jsx       # Komponen tombol generik
│   │   ├── Icon.jsx         # Registry icon (Material Design)
│   │   ├── Layout.jsx       # Layout utama (TopNav + SideNav + Outlet)
│   │   ├── MiniBookCard.jsx
│   │   ├── SideNavBar.jsx   # Sidebar navigasi kiri
│   │   └── TopNavBar.jsx    # Header atas
│   ├── hooks/
│   │   └── useAuth.jsx      # Context & hook autentikasi
│   ├── pages/
│   │   ├── BookDetail.jsx   # Halaman detail buku
│   │   ├── Catalog.jsx      # Katalog buku dengan filter
│   │   ├── Dashboard.jsx    # Beranda user
│   │   ├── Loans.jsx        # Peminjaman & riwayat user
│   │   ├── Login.jsx        # Halaman login
│   │   ├── Register.jsx     # Halaman registrasi
│   │   ├── Settings.jsx     # Pengaturan profil user
│   │   ├── Wishlist.jsx     # Daftar favorit user
│   │   └── admin/
│   │       ├── AdminDashboard.jsx  # Dashboard admin
│   │       ├── AdminInventory.jsx  # Manajemen buku
│   │       ├── AdminLoans.jsx      # Approve/tolak peminjaman
│   │       ├── AdminReports.jsx    # Laporan & export CSV
│   │       └── AdminUsers.jsx      # Manajemen user
│   ├── services/
│   │   └── api.js           # Axios instance + semua API calls
│   ├── App.jsx              # Router utama + route protection
│   ├── index.css            # Global styles & Tailwind
│   └── main.jsx             # Entry point React
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── vite.config.js
└── package.json
```

---

## Setup & Menjalankan

### 1. Install dependencies
```bash
cd client
npm install
```

### 2. Jalankan development server
```bash
npm run dev
```

Aplikasi berjalan di: `http://localhost:5173`

> Pastikan server backend sudah berjalan di port 3000 sebelum menjalankan client.

### 3. Build untuk production
```bash
npm run build
```

Output di folder `dist/`.

---

## Konfigurasi Proxy

Vite dikonfigurasi untuk meneruskan request API ke server backend:

```js
// vite.config.js
server: {
  proxy: {
    '/api'         → http://localhost:3000
    '/book-covers' → http://localhost:3000
    '/uploads'     → http://localhost:3000
  }
}
```

Sehingga request dari browser ke `/api/books` akan diteruskan ke `http://localhost:3000/api/books`.

---

## Routing

### Route Publik (tanpa login)
| Path | Halaman |
|------|---------|
| `/login` | Halaman login |
| `/register` | Halaman registrasi |

### Route User (perlu login)
| Path | Halaman |
|------|---------|
| `/` | Dashboard / Beranda |
| `/catalog` | Katalog buku |
| `/books/:id` | Detail buku |
| `/loans` | Peminjaman aktif |
| `/history` | Riwayat peminjaman |
| `/wishlist` | Daftar favorit |
| `/settings` | Pengaturan profil |

### Route Admin (role: admin)
| Path | Halaman |
|------|---------|
| `/admin` | Dashboard admin |
| `/admin/books` | Manajemen inventaris |
| `/admin/loans` | Approve/tolak peminjaman |
| `/admin/users` | Manajemen anggota |
| `/admin/reports` | Laporan & analitik |

Route admin otomatis redirect ke `/` jika diakses oleh user biasa.

---

## Autentikasi

Dikelola oleh `useAuth` hook dengan React Context.

```jsx
import { useAuth } from '../hooks/useAuth';

const { user, token, loading, login, logout, updateProfile } = useAuth();
```

| Property/Method | Keterangan |
|-----------------|------------|
| `user` | Data user yang sedang login (null jika belum login) |
| `token` | JWT token |
| `loading` | true saat sedang cek session |
| `login(user, token)` | Simpan session ke localStorage |
| `logout()` | Hapus session |
| `updateProfile(user)` | Update data user di state & localStorage |

Token disimpan di `localStorage` dan otomatis dikirim di setiap request API via Axios interceptor.

---

## API Service

Semua API call terpusat di `src/services/api.js`.

### bookAPI
```js
bookAPI.getAll(params)          // GET /api/books
bookAPI.search(query)           // GET /api/books/search?q=
bookAPI.getPopular(limit)       // GET /api/books/popular
bookAPI.getNewArrivals(limit)   // GET /api/books/new-arrivals
bookAPI.getById(id)             // GET /api/books/:id
bookAPI.getSimilar(id, limit)   // GET /api/books/:id/similar
bookAPI.borrow(bookId)          // POST /api/books/:bookId/borrow
bookAPI.create(data)            // POST /api/books  [admin]
bookAPI.update(id, data)        // PUT /api/books/:id  [admin]
bookAPI.delete(id)              // DELETE /api/books/:id  [admin]
```

### loanAPI
```js
loanAPI.getByUser(userId)       // GET /api/users/:userId/loans
loanAPI.return(loanId)          // POST /api/loans/:loanId/return
loanAPI.extend(loanId, days)    // POST /api/loans/:loanId/extend
loanAPI.getPending()            // GET /api/loans/pending  [admin]
loanAPI.getAllActive()           // GET /api/loans/active  [admin]
loanAPI.getOverdue()            // GET /api/loans/overdue  [admin]
loanAPI.approve(loanId)         // POST /api/loans/:loanId/approve  [admin]
loanAPI.reject(loanId, reason)  // POST /api/loans/:loanId/reject  [admin]
loanAPI.payFine(loanId)         // POST /api/loans/:loanId/pay-fine  [admin]
loanAPI.sendReminders()         // POST /api/loans/send-reminders  [admin]
loanAPI.export(params)          // GET /api/loans/export  [admin]
```

### wishlistAPI
```js
wishlistAPI.getAll()            // GET /api/wishlist
wishlistAPI.add(bookId)         // POST /api/wishlist/:bookId
wishlistAPI.remove(bookId)      // DELETE /api/wishlist/:bookId
```

### userAPI
```js
userAPI.getAll()                // GET /api/users  [admin]
userAPI.getById(id)             // GET /api/users/:id
userAPI.update(id, data)        // PUT /api/users/:id
userAPI.changePassword(id, data)// POST /api/users/:id/password
userAPI.uploadAvatar(id, file)  // POST /api/users/:id/avatar
```

### categoryAPI
```js
categoryAPI.getAll()            // GET /api/categories
```

---

## Komponen Utama

### Icon
Registry icon terpusat berbasis Material Design (`react-icons/md`).

```jsx
import Icon from '../components/Icon';

<Icon name="menu_book" size={24} className="text-primary" />
```

Icon yang tersedia: `menu_book`, `home`, `library_books`, `collections_bookmark`, `favorite`, `history`, `settings`, `dashboard`, `inventory_2`, `group`, `analytics`, `assignment`, `bookmark_added`, `check_circle`, `cancel`, `warning`, `pending`, `payments`, `update`, `filter_alt`, `sort`, dan lainnya.

---

### BookCard
Kartu buku untuk grid katalog.

```jsx
<BookCard
  book={book}
  onWishlist={(id) => handleAddWishlist(id)}  // opsional
  showStatus={true}                            // tampilkan badge Tersedia/Dipinjam
/>
```

---

### Layout
Wrapper halaman dengan TopNavBar + SideNavBar. Semua halaman yang memerlukan navigasi dibungkus oleh komponen ini via `<Outlet />`.

---

## Halaman

### Loans (`/loans`)
Menampilkan peminjaman user dengan fitur:
- Tab **Aktif** dan **Riwayat**
- Statistik ringkas (dipinjam, terlambat, total denda)
- **Progress bar** sisa hari jatuh tempo (hijau → kuning → merah)
- Sorting by: jatuh tempo / terbaru / judul
- **Dialog konfirmasi** sebelum return/extend
- Badge sisa perpanjangan (maks 2x)
- Tampilan denda per buku
- Toast notification

### AdminLoans (`/admin/loans`)
Panel admin untuk manajemen peminjaman:
- Tab **Menunggu Persetujuan** / **Aktif** / **Terlambat**
- **Approve** permintaan peminjaman
- **Tolak** dengan alasan (dialog input)
- **Lunasi denda** user
- Search by judul/nama/username

### AdminReports (`/admin/reports`)
Laporan dan analitik:
- Statistik real-time dari database
- Daftar peminjaman terlambat
- Panel denda belum dibayar vs terkumpul
- **Kirim reminder** ke user mendekati jatuh tempo
- **Export CSV** dengan filter status & rentang tanggal
- **Print** ke PDF

---

## Alur Peminjaman

```
1. User buka halaman detail buku → klik "Pinjam Sekarang"
2. Status loan: PENDING → user dapat notifikasi "Menunggu persetujuan"
3. Admin buka /admin/loans → tab "Menunggu Persetujuan"
4. Admin klik "Setujui" → status: ACTIVE, stok berkurang, notifikasi ke user
   atau "Tolak" + alasan → status: REJECTED, notifikasi ke user
5. User buka /loans → bisa lihat status, perpanjang (maks 2x), atau kembalikan
6. User klik "Kembalikan" → status: RETURNED
   Jika terlambat → denda dihitung otomatis ($0.50/hari)
7. Admin lunasi denda dari halaman /admin/loans
```

---

## Aturan Bisnis

| Aturan | Nilai Default |
|--------|---------------|
| Maksimal buku dipinjam per user | 5 buku |
| Durasi pinjaman | 14 hari |
| Maksimal perpanjangan | 2 kali |
| Durasi perpanjangan | 7 hari per kali |
| Denda keterlambatan | $0.50 per hari |
| Reminder otomatis | H-3 sebelum jatuh tempo |

Semua nilai di atas dapat diubah melalui tabel `system_settings` di database.
