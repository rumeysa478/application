---
version: 1
name: Habitime Playful Wellness
description: "Vibrant, high-contrast, flat-pastel wellness design system with color-coded habit domains (Water, Medication, Living Mascot), chunky rounded cards, and high-energy action pills."
colors:
  # Canvas & Base
  canvas: "#FFFFFF"
  on-canvas: "#000000"
  surface-muted: "#F8FAFC"
  border-subtle: "#E2E8F0"

  # Domain: Living Mascot / Growth (Apple Green)
  living-card: "#7ED957"
  living-container: "#A8F368"
  living-track: "#00BF63"
  living-fill: "#C7F974"
  living-text: "#000000"
  living-accent: "#15803D"

  # Domain: Water / Hydration (Pastel Sky Cyan)
  water-card: "#99E5F2"
  water-circle: "#00C2CB"
  water-track: "#003B73"
  water-fill: "#38BDF8"
  water-text: "#000000"
  water-badge-bg: "#56CFE1"
  water-badge-text: "#003B73"
  water-percent: "#0096C7"

  # Domain: Medication / Health (Pastel Coral Rose)
  med-card: "#F8A5A5"
  med-circle: "#F87171"
  med-track: "#881337"
  med-fill: "#FF6B6B"
  med-text: "#000000"
  med-badge-bg: "#F87171"
  med-badge-text: "#450A0A"
  med-badge-orange: "#FB923C"
  med-badge-orange-text: "#7C2D12"
  med-percent: "#F59E0B"

  # Domain: Action Buttons (Butter Golden Yellow)
  action-yellow: "#FFD166"
  action-yellow-hover: "#FCCE4E"
  action-text-orange: "#FF8500"
  action-text-brown: "#78350F"
  action-text-dark: "#451A03"

  # Badges & Chromes
  chrome-cyan: "#00C2CB"
  badge-purple-bg: "#E0AAFF"
  badge-purple-text: "#7E22CE"
  badge-orange-bg: "#FB923C"
  badge-orange-text: "#7C2D12"
  trophy-gold: "#F59E0B"
typography:
  display-title:
    fontFamily: System
    fontSize: 28px
    fontWeight: "900"
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-card:
    fontFamily: System
    fontSize: 22px
    fontWeight: "900"
    lineHeight: 28px
    letterSpacing: 0.04em
  headline-sub:
    fontFamily: System
    fontSize: 15px
    fontWeight: "800"
    lineHeight: 20px
    letterSpacing: -0.01em
  body-metric:
    fontFamily: System
    fontSize: 14px
    fontWeight: "800"
    lineHeight: 18px
    letterSpacing: 0em
  label-button:
    fontFamily: System
    fontSize: 16px
    fontWeight: "900"
    lineHeight: 20px
    letterSpacing: 0.02em
  badge-text:
    fontFamily: System
    fontSize: 12px
    fontWeight: "800"
    lineHeight: 14px
    letterSpacing: 0.01em
  percent-text:
    fontFamily: System
    fontSize: 15px
    fontWeight: "900"
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  card: 28px
  container: 20px
  pill: 9999px
  circle: 9999px
  bar: 9999px
spacing:
  gutter: 16px
  card-gap: 16px
  card-padding: 18px
  element-gap: 12px
  badge-gap: 8px
components:
  card-living:
    backgroundColor: "{colors.living-card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  card-water:
    backgroundColor: "{colors.water-card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  card-medication:
    backgroundColor: "{colors.med-card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-padding}"
  button-action:
    backgroundColor: "{colors.action-yellow}"
    rounded: "{rounded.pill}"
    height: 48px
  progress-bar:
    rounded: "{rounded.bar}"
    height: 18px
---

# Habitime Playful Wellness Tasarım Sistemi (DESIGN.md)

## 1. Genel Bakış ve Tasarım Felsefesi

**Habitime Playful Wellness**, alışkanlık takibini klinik soğukluktan ve sıkıcı tablolardan çıkarıp enerjik, dost canlısı ve ödüllendirici bir görsel deneyime dönüştürür.

Bu sistemin kalbinde **"Alan Bazlı Renk Kodlaması (Domain Color-Coding)"** ve **"Tombul, Dokunulası Geometri (Chunky Tactile Surfaces)"** yatar:
1. **Canlı Yeşil (`#7ED957`)**: Yaşayan maskot, kademeli büyüme ve genel sağlık vitalitesi.
2. **Pastel Gök Mavisi (`#99E5F2`)**: Su tüketimi, hidrasyon ve tazelik.
3. **Pastel Mercan Pembe (`#F8A5A5`)**: İlaç disiplini, saatlik dozlar ve sağlık koruması.
4. **Güneş Sarısı (`#FFD166`)**: Anında eyleme geçirici kanıt ekleme ve erteleme butonları.
5. **Derin Kontrast İlerleme Çubukları**: Açık pastel kartların üzerinde hemen göze çarpan derin lacivert (`#003B73`), zümrüt yeşil (`#00BF63`) ve vişne bordosu (`#881337`) zemin üzerine yerleştirilen parlak neon dolgular.

Bu tasarım dili, kullanıcının ekranı açtığı anda tek bir kelime okumadan bile kartın amacını (Su vs. İlaç) saniyesinde ayırt etmesini sağlar.

---

## 2. Renk Mimarisi ve Palet (Colors)

| Token Adı | Hex Değeri | Rolü ve Kullanım Yeri |
|---|---|---|
| `canvas` | `#FFFFFF` | Ana sayfa arka planı. Temiz, ferah beyaz zemin. |
| `on-canvas` | `#000000` | Başlıklar, logo metni, kart başlıkları. Tam siyah, yüksek kontrast. |
| **Living Mascot (Büyüme)** | | |
| `living-card` | `#7ED957` | Yaşayan Çiçek kartı zemin rengi (elma yeşili). |
| `living-container` | `#A8F368` | Maskot SVG/ikonunun yer aldığı açık fıstık yeşili squircle kutu. |
| `living-track` | `#00BF63` | Çiçek ilerleme çubuğu boş kanal rengi (zümrüt yeşil). |
| `living-fill` | `#C7F974` | Çiçek ilerleme çubuğu dolu kısım (parlak açık neon sarı-yeşil). |
| **Water Habit (Su Takibi)** | | |
| `water-card` | `#99E5F2` | "SU İÇ" alışkanlık kartı zemin rengi (pastel açık camgöbeği/turkuaz). |
| `water-circle` | `#00C2CB` | Su damlası, düzenle ve sil butonlarının dairesel arka planı. |
| `water-track` | `#003B73` | Su ilerleme çubuğu boş kanal rengi (derin gece mavisi). |
| `water-fill` | `#38BDF8` | Su ilerleme çubuğu dolu kısım (parlak elektrik gök mavisi). |
| `water-badge-bg` | `#56CFE1` | Saat ve son kanıt hap etiket zemin rengi. |
| `water-badge-text` | `#003B73` | Saat ve son kanıt hap etiket koyu mavi yazı rengi. |
| **Medication Habit (İlaç Takibi)** | | |
| `med-card` | `#F8A5A5` | "İLAÇ İÇ" alışkanlık kartı zemin rengi (pastel somon/mercan pembe). |
| `med-circle` | `#F87171` | İlaç kapsülü, düzenle ve sil butonlarının dairesel mercan arka planı. |
| `med-track` | `#881337` | İlaç ilerleme çubuğu boş kanal rengi (koyu vişne bordosu). |
| `med-fill` | `#FF6B6B` | İlaç ilerleme çubuğu dolu kısım (canlı mercan kırmızısı). |
| `med-badge-bg` | `#F87171` | Saat ve son kanıt hap etiket zemin rengi (koyu pembe). |
| `med-badge-text` | `#450A0A` | Saat ve son kanıt etiket yazı rengi (koyu bordo). |
| **Action & Interaction (Eylem Butonları)** | | |
| `action-yellow` | `#FFD166` | "Kanıt Ekle" ve "Ertele" buton zemin rengi (tatlı tereyağı sarısı). |
| `action-text-orange` | `#FF8500` | "Kanıt Ekle" butonu turuncu kalın metni. |
| `action-text-brown` | `#78350F` | "Ertele (30 dk / 15 dk)" butonu sıcak kahverengi metni. |
| **Status Badges & Accent Chrome** | | |
| `badge-purple-bg` | `#E0AAFF` | Su kartı erteleme rozeti zemini (açık leylak). |
| `badge-purple-text` | `#7E22CE` | Su kartı erteleme rozeti mor yazısı (`ertele: 1/3`). |
| `badge-orange-bg` | `#FB923C` | İlaç kartı erteleme rozeti zemini (sıcak turuncu). |
| `badge-orange-text` | `#7C2D12` | İlaç kartı erteleme rozeti koyu turuncu yazısı (`ertele: 1/3`). |
| `chrome-cyan` | `#00C2CB` | Üst bardaki sepet ve pazar dairesel ikonu. |
| `trophy-gold` | `#F59E0B` | Üst bardaki yarışma lig kupası ikonu. |

---

## 3. Tipografi Hiyerarşisi (Typography)

Tüm yazı tipleri **yuvarlatılmış, kalın ve kendinden emin** bir karaktere sahiptir. Sistemde açık veya ince (light/regular) fontlar kullanılmaz; okunabilirlik ve tombul dost canlısı his için ağırlıklar `800` (ExtraBold) ve `900` (Black) seviyesindedir.

```
Display:      HabiTime (28px / Black 900 / -0.02em)
Headlines:    SU İÇ • İLAÇ İÇ • Yasayan Çiçek (22px / Black 900 / +0.04em)
Metrics:      günlük su tüketimi: 0.40 / 2.00 L (%20) (14px / ExtraBold 800)
Action CTA:   kanıt ekle • ertele (30 dk) (16px / Black 900)
Badge Meta:   09:00 - 23:00 • son kanıt: 22:21 • ertele: 1/3 (12px / ExtraBold 800)
Micro Label:  su iç ve büyüt (13px / ExtraBold 800)
```

---

## 4. Spacing, Düzen ve Kart Mimarisi

- **Ekran Kenar Boşluğu (`gutter`)**: `16px` (İçerik ekran kenarlarına yapışmaz, dengeli nefes alır).
- **Kartlar Arası Dikey Boşluk (`card-gap`)**: `16px`.
- **Kart İçi Dolgu (`card-padding`)**: `18px` ile `20px` arası.
- **Buton Yüksekliği (`action-height`)**: `48px` tam pill (`borderRadius: 9999px`).
- **İlerleme Çubuğu Yüksekliği (`bar-height`)**: `18px` tombul pill kanal (`borderRadius: 9999px`).
- **Dairesel İkon Butonları (`icon-circle`)**: `42px` × `42px` tam daire.
- **Rozet/Hap Yüksekliği (`badge-height`)**: `26px`, yatay dolgu `12px`.

---

## 5. Şekil Dili ve Yuvarlaklık (Shapes & Radii)

| Seviye | Değer | Kullanıldığı Öğeler |
|---|---|---|
| `rounded.card` | `28px` | Tüm ana kartlar (Yaşayan Çiçek, Su Kartı, İlaç Kartı). |
| `rounded.container` | `20px` | Kart içindeki görsel kutucuklar (Bitki squircle'ı). |
| `rounded.pill` | `9999px` | "Kanıt Ekle", "Ertele", zaman/kanıt rozetleri. |
| `rounded.bar` | `9999px` | İlerleme çubuğu kanalı ve içindeki dolgu ucu. |
| `rounded.circle` | `9999px` | Düzenle (kalem), Sil (çöp kutusu), Pazar (sepet), Kupa daireleri. |

---

## 6. Habitime Ekranları ve Bileşen Spesifikasyonları

### 6.1. Üst Bar (Header & Top Chrome)
- Sol tarafta profil fotoğrafı / avatar butonu: Siyah dairesel çerçeve (`#000000`).
- Merkezde **`HabiTime`** logosu: `fontSize: 28`, `fontWeight: '900'`, `#000000`.
- Sağ tarafta 2 dairesel buton:
  - 🛒 **Pazar Butonu**: `#00C2CB` zemin, siyah sepet ikonu.
  - 🏆 **Yarışma Butonu**: `#00C2CB` zemin, altın kupa ikonu.

### 6.2. Yaşayan Çiçek / İyileşme Maskotu Kartı (`PlantWidget` & `RecoveryWidget`)
- Zemin rengi: Canlı fıstık/elma yeşili (`#7ED957`).
- Sol tarafta maskot squircle kutusu: `#A8F368`, içinde canlı büyüyen yapraklar.
- Sağ üstte başlık: **`Yasayan Çiçek`** (`#000000`).
- Kalın çift renkli ilerleme çubuğu:
  - Zemin kanalı: Koyu zümrüt yeşil (`#00BF63`).
  - Dolgu ucu: Neon açık fıstık sarısı (`#C7F974`).
- Çubuğun altında mikro metin: **`su iç ve büyüt`**.
- İlaç aktifken otomatik olarak **`Şifa Maskotu`** (`#A855F7` / `#C084FC`) moduna geçerek hastanın iyileşme evrelerini gösterir.

### 6.3. Su Alışkanlık Kartı (`SU İÇ`)
- Zemin rengi: Pastel turkuaz gök mavisi (`#99E5F2`).
- Sol başlık: Dairesel su damlası rozeti (`#00C2CB`), yanında büyük harfli **`SU İÇ`** (`#000000`, 22px).
- Sağ üst butonlar: Dairesel `#00C2CB` üzerinde ✏️ Düzenle ve 🗑️ Sil.
- Çift renkli su ilerleme çubuğu:
  - Kanal: Derin lacivert (`#003B73`).
  - Dolgu: Elektrik camgöbeği (`#38BDF8`).
- Metrik satırı:
  - Sol: `günlük su tüketimi: 0.40 / 2.00 L` (`#000000`, 800).
  - Sağ: `%20` (`#0096C7`).
- Rozetler satırı:
  - `09:00 - 23:00` (Açık camgöbeği `#56CFE1` hap, lacivert metin).
  - `son kanıt: 22:21` (Açık camgöbeği `#56CFE1` hap, lacivert metin).
  - `ertele: 1/3` (Pastel mor `#E0AAFF` hap, koyu mor metin).
- Alt aksiyon butonları:
  - 📸 **`kanıt ekle`**: `#FFD166` zemin, `#FF8500` turuncu yazı, solunda yıldızlı kamera ikonu.
  - ⏳ **`ertele (30 dk)`**: `#FFD166` zemin, `#78350F` kahverengi yazı, solunda kum saati ikonu.

### 6.4. İlaç Alışkanlık Kartı (`İLAÇ İÇ`)
- Zemin rengi: Pastel somon/mercan pembe (`#F8A5A5`).
- Sol başlık: Dairesel mercan kapsül rozeti (`#F87171`), yanında büyük harfli **`İLAÇ İÇ`** (`#000000`, 22px).
- Sağ üst butonlar: Dairesel `#F87171` üzerinde ✏️ Düzenle ve 🗑️ Sil.
- Çift renkli ilaç ilerleme çubuğu:
  - Kanal: Koyu vişne bordosu (`#881337`).
  - Dolgu: Canlı mercan kırmızısı (`#FF6B6B`).
- Metrik satırı:
  - Sol: `günlük ilaç tüketimi: 2 / 10` (`#000000`, 800).
  - Sağ: `%20` (`#F59E0B`).
- Rozetler satırı:
  - `09:00 - 23:00` (Mercan `#F87171` hap, bordo metin).
  - `son kanıt: 22:21` (Mercan `#F87171` hap, bordo metin).
  - `ertele: 1/3` (Sıcak turuncu `#FB923C` hap, koyu turuncu metin).
- Alt aksiyon butonları:
  - 📸 **`kanıt ekle`**: `#FFD166` zemin, `#FF8500` turuncu yazı.
  - ⏳ **`ertele (15 dk)`**: `#FFD166` zemin, `#78350F` kahverengi yazı (İlaç kuralı: 15 dakika!).

### 6.5. Kamera Kanıt Ekranı (`CameraProofScreen`)
- Tam ekran vizör, üstte geri dönme ve AI durum rozeti (`#00C2CB`).
- Kadraj odak çerçevesi: Sarı/turkuaz köşebentler.
- Çekim sonrası önizleme kartı:
  - Su için: `#99E5F2` kenarlıklı önizleme kutusu.
  - İlaç için: `#F8A5A5` kenarlıklı önizleme kutusu.
  - Doğrulama butonu: `#FFD166` zemin üzerine kalın `#000000` veya `#FF8500` metin.
  - Tekrar çek butonu: Beyaz hap buton, `#000000` metin.

### 6.6. Ekleme / Düzenleme Ekranları (`AddHabitScreen`, `EditHabitScreen`)
- Üst sekme seçici:
  - `[ 💧 Su Takibi ]` (Seçiliyken `#99E5F2` zemin, siyah kalın yazı).
  - `[ 💊 İlaç Takibi ]` (Seçiliyken `#F8A5A5` zemin, siyah kalın yazı).
- Saat seçici (Time Picker):
  - Saat ve dakika çarkları veya alarm formatında tombul seçim pencereleri.
  - Onay butonu: `#FFD166` zeminli tam pill buton.

### 6.7. Sosyal & Haftalık Yarışma Ekranı (`LeaderboardScreen`)
- Lider tablosu sıralama satırları:
  - 1. Sıra (Altın Taç): `#FEF08A` açık sarı zemin kart.
  - Üst %10 Dilimdekiler: Sağ köşede **`🔥 2x Puan`** turuncu parlak rozeti.
  - Diğer yarışmacılar: Beyaz kart, `borderRadius: 20px`.
- Puan gönderme modalı:
  - Dostuna hediye puan aktarımı: Hediye paketi ikonu, sarı onay butonu (`#FFD166`).

---

## 7. İkonografi ve Özel Varlıklar

- **Kamera İkonu**: Siyah gövde, gümüş objektif halkası ve sol üst köşesinde parıldayan altın yıldız (`⭐📸`). "Kanıt Ekle" aksiyonunun vazgeçilmez görsel imzasıdır.
- **Kum Saati İkonu**: Ahşap tabanlı, ortasında altın sarısı kum tanecikleri süzülen klasik illüstratif kum saati (`⏳`).
- **Su Damlası**: İki tonlu mavi yansımalı su damlası.
- **İlaç Kapsülü**: İki parçalı (kırmızı-beyaz veya yeşil-beyaz) hafif eğimli sevimli kapsül.
- **Alışveriş Sepeti & Kupa**: Siyah silüet veya altın 3D kupa.

---

## 8. Tasarım Kuralları (Do's and Don'ts)

### Yapılması Gerekenler (Do)
- Kart arka plan renklerini alışkanlık türüne göre **kesinlikle** ayırın: Su = `#99E5F2`, İlaç = `#F8A5A5`, Maskot = `#7ED957`.
- Eylem butonlarında ("Kanıt Ekle" ve "Ertele") daima altın sarısı zemin (`#FFD166`) ve kalın turuncu/kahverengi metin kontrastını koruyun.
- İlerleme çubuklarında yüksek kontrastlı derin koyu tonları kanal (track), parlak neon tonları dolgu (fill) olarak kullanın.
- Köşeleri cömertçe yuvarlayın: Kartlar en az `28px`, butonlar ve rozetler daima tam pill (`9999px`).
- Başlıkları daima tam siyah (`#000000`) ve en kalın font ağırlığı (`900`) ile yazın.

### Yapılmaması Gerekenler (Don't)
- Su kartında kırmızı, ilaç kartında mavi renk kullanmayın; renk-fonksiyon eşleşmesi kullanıcı refleksidir.
- Kart kenarlarına sert, koyu veya kirli gölgeler eklemeyin; tasarım temiz, düz (flat-clean) ve renk kontrastıyla ayrışmalıdır.
- İnce (light / regular / 300 / 400) font ağırlıkları kullanmayın; metinler kart üzerinde okunaksızlaşır.
- Butonları köşeli veya hafif yuvarlak (örn: 4px - 8px) yapmayın; aksiyon butonları mutlaka tam hap (pill) olmalıdır.
- Siyah yerine gri tonlu soluk başlıklar koymayın; yüksek kontrast bu estetiğin temelidir.

---

## 9. React Native Tasarım Token Dosyası (`src/theme/theme.js`)

Aşağıdaki kod bloğu, Expo / React Native uygulamasında `StyleSheet` içinde doğrudan kullanılabilen merkezi tema dosyasıdır:

```javascript
/**
 * Habitime Playful Wellness Tasarım Token'ları
 * Referans: DESIGN.md ve örnek görsel analizi
 */
export const THEME = {
  colors: {
    // Canvas & Temel
    canvas: '#FFFFFF',
    textPrimary: '#000000',
    textMuted: '#64748B',
    borderSubtle: '#E2E8F0',

    // Yaşayan Çiçek & Maskot Alanı
    living: {
      card: '#7ED957',
      container: '#A8F368',
      track: '#00BF63',
      fill: '#C7F974',
      text: '#000000',
    },

    // Su Takibi Alanı
    water: {
      card: '#99E5F2',
      circle: '#00C2CB',
      track: '#003B73',
      fill: '#38BDF8',
      text: '#000000',
      badgeBg: '#56CFE1',
      badgeText: '#003B73',
      percent: '#0096C7',
    },

    // İlaç Takibi Alanı
    medication: {
      card: '#F8A5A5',
      circle: '#F87171',
      track: '#881337',
      fill: '#FF6B6B',
      text: '#000000',
      badgeBg: '#F87171',
      badgeText: '#450A0A',
      badgeOrange: '#FB923C',
      badgeOrangeText: '#7C2D12',
      percent: '#F59E0B',
    },

    // Aksiyon Butonları (Kanıtla & Ertele)
    action: {
      yellow: '#FFD166',
      yellowHover: '#FCCE4E',
      textOrange: '#FF8500',
      textBrown: '#78350F',
      textDark: '#451A03',
    },

    // Rozetler & Chrome Vurguları
    badges: {
      purpleBg: '#E0AAFF',
      purpleText: '#7E22CE',
      orangeBg: '#FB923C',
      orangeText: '#7C2D12',
      cyan: '#00C2CB',
      gold: '#F59E0B',
    },
  },

  typography: {
    displayTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: -0.5,
    },
    cardHeadline: {
      fontSize: 22,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: 0.8,
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: '#000000',
    },
    actionButton: {
      fontSize: 16,
      fontWeight: '900',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    percentText: {
      fontSize: 15,
      fontWeight: '900',
    },
    microLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
    },
  },

  radii: {
    card: 28,
    container: 20,
    pill: 9999,
    circle: 9999,
    bar: 9999,
  },

  spacing: {
    gutter: 16,
    cardGap: 16,
    cardPadding: 18,
    badgeGap: 8,
    rowGap: 12,
  },

  shadows: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    action: {
      shadowColor: '#FF8500',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

export default THEME;
```
