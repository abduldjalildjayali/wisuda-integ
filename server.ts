import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Graduate, ActivityLog } from "./src/types";

// Default template graduates to seed if no file exists
const generateDefaultGraduates = (): Graduate[] => {
  const sanitize = (val: string) => {
    if (!val) return "";
    const cleaned = val.trim();
    if (cleaned === "#N/A" || cleaned === "undefined" || cleaned === "null") return "";
    return cleaned;
  };

  const RAW_TSV = `001	1245722027	MARDIA REVALINA RAMLI, Amd.Kom	MANAJEMEN INFORMATIKA	3.82	114	RAMLI ASRUL	JALIA YAMLEAN	SISTEM INFORMASI PENDAFTARAN NOMOR ANTRIAN ONLINE PADA KANTOR DISDUKCAPIL KOTA TERNATE BERBASIS WEBSITE 	Rahmawati Nasser, S.Pd., M.Pd	https://drive.google.com/open?id=1Isc_xhlggcYzysvUXdbsJu_8_6kHrAii	082187089266
002	1245722035	NADIA IKSAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.82	116	IKSAN M. BESE 	WATI HJ. ALI HAMISI	SISTEM PENGELOLAAN KEUANGAN MASJID ASSIRAZ DESA JARAKORE KEC.SAHU. KAB.HALBAR BERBASIS WEBSITE 	Abdul Djalil Djayali, ST., M.kom	https://drive.google.com/file/d/1u4xjLYrQw-vIhg_uD-9alvPwrOZ1WZZW/view?usp=drive_link	082187244913
003	1245722042	NURFIKRA AULIA H. HAMKA, Amd.Kom	MANAJEMEN INFORMATIKA	3.75	114	FAHMI .ABD. KAHAR	SUMIYATI.R. TANJUNG	SISTEM INFORMASI PENJUALAN BERAS BULOG PADA GUDANG PERUM BULOG CABANG TERNATE BERBASIS WEBSITE 	Akil Thalib, S.ST., M.Kom	https://drive.google.com/open?id=1bdcRxq4ODjCNZQgMcTkmEw6eqyeIaXMx	085212553758
004	1245622008	ENDANG MUHAMMAD, Amd.Kom	TEKNIK KOMPUTER	3.74	108	MUHAMMAD SOLEMAN (ALMARHUM)	TITIN ALFIAN MAKAHINSADE	PERANCANGAN PROTOTIPE SIMULASI PELACAKAN CAHAYA BUATAN OTOMATIS BERBASIS ARDUINO DENGAN TAMPILAN LCD DAN INDIKATOR DAYA PANEL SURYA	Sitna Hajar Hadad, ST.,M.Eng	https://drive.google.com/open?id=1IJbjxNjNrezHOJY7hA_3HaUCA3FDAleF	082192929759
005	1245622027	MULIANA MURSIDA, Amd.Kom	TEKNIK KOMPUTER	3.67	108	MURSIDA	NURTANG, S.PD	SISTEM PENYIRAMAN OTOMATIS TANAMAN HIAS BERBASIS  INTERNET OF THINGS (IOT) DENGAN NOTIFIKASI VISUAL  DAN AUDIO	Ilham Djufri, ST., M.Kom	https://drive.google.com/open?id=1fdOaYREgt6aKBz1cQjlnc6p_URP1fWjA	081221511190
006	1245622019	JUNAIDI DJASMIN, Amd.Kom	TEKNIK KOMPUTER	3.5	110	DJASMIN ISMAIL	ASMA A. RACHMAN	ANALISIS PERBANDINGAN KINERJA JARINGAN  MENGGUNAKAN WIRELESS MESH DAN WIRELINE  MESH  DI DESA PODOL HALMAHERA BARAT 	Ilham Djufri, ST.,M.Kom	https://drive.google.com/open?id=17kuUi8dOzE1qF_2pTXpE1AEPcip73dRa	082215479191
007	1245622046	SRI WAHYUNITA SANIA, Amd.Kom	TEKNIK KOMPUTER	3.49	111	HAMKA SANIA	INDRAWATI BAWILI	PENGEMBANGAN ALAT PENGUKUR KADAR GULA DARAH BERBASIS IOT UNTUK PEMANTAUAN KESEHATAN REAL-TIME MENGGUNAKAN SUARA	M.Kasyif.G. Umar,.S.ST. M.Kom	https://drive.google.com/open?id=1Hsnu0uFy8dMWi0V81fLvtHKfuHTzhj1F	085342885971
008	1245622045	SRI JOVANKA BAHRAIN, Amd.Kom	TEKNIK KOMPUTER	3.46	108	BAHRAIN BUTON	WA ODE MASRIATI	RANCANG BANGUN TEMPAT SAMPAH OTOMATIS  BERBASIS ARDUINO DAN SENSOR ULTRASONIK HC-SR04  UNTUK PEMILAHAN SAMPAH ORGANIK DAN  ANORGANIK	Iswan A. Thais,.SPd.,M.Pd	https://drive.google.com/open?id=1iRDYaPN9KlgKsFpkC3hJuh6bJ_w04kji	081341836844
009	1245620027	HAIKAL ANSARI, Amd.Kom	TEKNIK KOMPUTER	3.45	112						
010	1245622034	NURUL ASY S. YUSUF, Amd.Kom	TEKNIK KOMPUTER	3.43	108	SAHMAL YUSUF 	RATNA LUMA	PERANCANGAN DAN IMPLEMENTASI MANAJEMEN USER DAN BANDWIDTH MENGGUNAKAN MIKHMON SERVER DI DESA PODOL HALMAHERA BARAT 	Laroma Larumbia, ST., MT	https://drive.google.com/open?id=1Z3hE9LH36a3uD3Cmgv1iyZbmg3fX7gRW	082190219113
011	1245622012	HIDAYAH NURWAHYUDI, Amd.Kom	TEKNIK KOMPUTER	3.43	108	ABDUL KAHAR TOPORA	MASURIA SUJALI	PERANCANGAN WEBSITE INFORMASI DAN LAYANAN PUBLIK UNTUK PEMBERDAYAAN MASYARAKAT DESA MOMOJIU, KECAMATAN MOROTAI SELATAN	Ilham Djufri, ST., M.Kom 	https://drive.google.com/open?id=1oz724Yl3c9Utg5o2f2LfOctv6PMyCN0s	081280618488
012	1245622033	NURSINTA R. SANGAJI, Amd.Kom	TEKNIK KOMPUTER	3.42	108	RUSLAN A. SANGAJI	UMIYAN HAMAYA	PERANCANGAN SISTEM PEMANTAUAN KUALITAS UDARA DALAM RUANGAN BELAJAR BERBASIS IOT	Abjan Samad, S. ST., M. Kom	https://drive.google.com/open?id=1OEY-EEDCgcs3lLKcvg1aEOvDOz1YR_OT	081362333481
013	1245622041	SALSABILA SILIM, Amd.Kom	TEKNIK KOMPUTER	3.42	108	ARHAJI SILIM	WAHNI ABDUL LATIF	PERLUASAN AKSES INTERNET MENGGUNAKAN TOPOLOGI POINT TO MULTI POINT DI DESA SIMAU KECAMATAN GALELA	Ilham Djufri,ST.,M.Kom	https://drive.google.com/open?id=1mXqysajT6hf8A4gok4IfI9hmviCximr7	081352861425
014	1245622032	NURSAIDA ILYAS, Amd.Kom	TEKNIK KOMPUTER	3.41	108	ILYAS SAPSUHA 	HAWA HUSALEKA 	PENGEMBANGAN SISTEM TEMPAT SAMPAH OTOMATIS BERBASIS ARDUINO DAN SENSOR ULTRASONIK UNTUK MEKANISME PENUTUPAN SAAT PENUH	Muksin Hi. Abdullah, ST., M.Si	https://drive.google.com/open?id=1w0ztR00RlQQC0PPmW2_OMUHtxEIr-LIU	081356432005
015	1245622031	NURMAINA J. MANAN, Amd.Kom	TEKNIK KOMPUTER	3.35	108	DJALAL MANAN	SAMSA SALEH	SISTEM INFORMASI PENERIMAAN SISWA BARU PADA SMP MUHAMMADIYAH 1 BACAN BERBASIS WEBSITE 	MUKSIN HI. ABDULLAH ST.,M.SI	https://drive.google.com/open?id=1bsrdyO9mhp_3tPGm8sNgq8rKF4suqRan	082184873637
016	1245622029	NAJWA AMARILA BAHRAIN, Amd.Kom	TEKNIK KOMPUTER	3.28	108	BAHRAIN BUTON 	WA ODE MASRYATI 	PERANCANGAN ALAT PENDETEKSI ASAP DIRUANGAN BER-AC MENGGUNAKAN ARDUINO DAN SENSOR GAS MQ-2	M Kasyif Gufran Umar, S.ST., M.Kom	https://drive.google.com/open?id=1epHOO3x2y3LwlPbLzlWvClm0uSdVdnJj	082210190693
017	1245622030	NURLELI RAKIB, Amd.Kom	TEKNIK KOMPUTER	3.24	108		AINUN MUSTAFA 	SISTEM PENDETEKSI CAIRAN INFUS OTOMATIS BERBASIS IOT DENGAN NOTIFIKASI TELEGRAM 	Seh Turuy ST.,M,Eng	https://drive.google.com/open?id=18nWYyXmFujxHB9cFzyIL69L0VjEmF2YU	081344296604
018	1245622039	SABRIA ABDUL, Amd.Kom	TEKNIK KOMPUTER	3.19	108						
019	1245622059	RAFLY A.J. MIRADJ, Amd.Kom	TEKNIK KOMPUTER	3.16	116	AMIN J MIRADJ	SUPIATI HAMISI	PARANCANGAN PROTOTYPE JEMURAN PAKAIAN OTOMATIS MENGGUNAKAN SERVO DAN RAINDROP SENSOR BERBASIS ARDUINO	Sitna Hajar Hadad, S.T.,M.Eng	https://drive.google.com/open?id=1ye3DyFDyDS4SOsh99UJifLtfl1QhpSOk	082194318087
020	1245622010	FAHNIA IRWAN, Amd.Kom	TEKNIK KOMPUTER	3.11	116	IRWAN ISMAIL	ROHATI SALASA	RANCANG BAMGUN SISTEM INFORMASI PENERIMAAN PERSERTA DIDIK PADA SMP MUAHAMMADIYAH PABOS BERBASIS WEBSITE DENGAN METODE SPIRAL	Mudar safi, ST.,M.Eng	https://drive.google.com/open?id=11je7AqtaSh40LdyTOW07EFGaUSft_IJQ	082358772098
021	1245621043	SAFIA M. RIZAL, Amd.Kom	TEKNIK KOMPUTER	3.1	108						
022	1245622049	SURIYANI TAKAREDAS, Amd.Kom	TEKNIK KOMPUTER	3.08	116	JUFRI TAKAREDAS	MARFUA JABAR	SISTEM PENYEBARAN INFORMASI JADWAL UJIAN DAN KEGIATAN SEKOLAH DI SMK NEGERI 5 TIDORE KEPULAUAN BERBASIS WEB	abjan samad, S.ST.,M.Kom 	https://drive.google.com/open?id=1NdXzOViJf11zzEkcyAgNTYtpCALDarbG	085608872886
023	1245622018	JUMAHIR NAWAWI, Amd.Kom	TEKNIK KOMPUTER	3.06	108			RANCANG BANGUN MEDIA PEMBELAJARAN INTERAKTIF ELEKTRONIKA DIGITAL BERBASIS ESP32	Mudar Safi, ST., M.Eng	https://drive.google.com/open?id=1Lqr1ss2TdqkWbP3sN7ZyuOOa1IKZlFEh	081228043729
024	1245621055	WILDAN MADANY, Amd.Kom	TEKNIK KOMPUTER	3.04	108						
025	1245622057	ARI FITRAH, Amd.Kom	TEKNIK KOMPUTER	3.03	125			SISTEM INFORMASI SEBARAN LOKASI KEDAI KOPI CITA RASA KOTA TERNATE BERBASIS WEB	Sitna Hajar Hadad, ST.M.Kom	https://drive.google.com/open?id=1pmsfYthmcFc_IpaDt9TgDVCQ3_S5jQeQ	082291432244
026	1245621018	GILBERTO FENIS FATTY, Amd.Kom	TEKNIK KOMPUTER	3.02	108	MARDENS FATTY	ASTUTI DURA	PEMANFAATAN SMART BREAKER ON OFF SWITH BERBASIS IOT SEBAGAI KONTROL POMPA PENYIRAMAN TANAMAN JARAK JAUH	Laroma Larumbia, ST., MT	https://drive.google.com/open?id=14jqeyfkIDeK8kG-NFUX691SeJxCyqi5-	085385898085
027	1245622054	RAHMAN AHMAD, Amd.Kom	TEKNIK KOMPUTER	3.02	108	AHMAD HJ MUHAMMAD 	ATI JUMAT 	DESAIN ALAT PENDETEKSI KEBOCORAN GAS LPG MENGGUNAKAN SENSOR MQ2 BERBASIS ARDUINO PADA RUMAH MAKAN BU DE	Ilham Djufri. ST.,M.Kom	https://drive.google.com/open?id=1UaIYveXZ9VWJTd2a08CYjZ7IQgxwwOjX	0823-1544-0175
028	1245621070	MUSA S. ABD RAHMAN, Amd.Kom	TEKNIK KOMPUTER	3.01	108			PEMANFAATAN SMART BREAKER ON/OFF BERBASIS IOT UNTUK KONTROL SWITCH LISTRIK DI LAB HARDWARE INSTITUT TEKNOLOGI GAMALAMA 	LAROMA LARUMBIA,ST.,MT	https://drive.google.com/open?id=1Oc5It-hP8RAHly6fF9lr9ZBkVJ3m1tqW	082137202064
029	1245622060	SRI SUYARTI, Amd.Kom	TEKNIK KOMPUTER	3.01	122	FOJI	MARWIYAH J. MIRADJ	PERANCANGAN APLIKASI LOKASI PENJUALAN KULINER KUE KHAS TERNATE BERBASIS WEB	M. Kasyif G. Umar, S., ST., M. Kom	https://drive.google.com/open?id=1WydbCUvVs2QgH6ozKPxg8efzkPlYHK9I	081340898746
030	1245722066	SITI RIA AKUN, Amd.Kom	MANAJEMEN INFORMATIKA	3.75	114	AKUN HADJI	AININ BAHAR	SISTEM INFORMASI PARKIR KENDARAAN BERMOTOR BERBASIS ANDROID PADA PELABUHAN BASTION KOTA TERNATE 	Rahmawati Nasser, S.Pd, M.Pd	https://drive.google.com/open?id=1qJCC-AwBn2aeCYYZmNwil7HcSR5b1hVX	085210235406
031	1245722016	FITRIA A. MUTALIB, Amd.Kom	MANAJEMEN INFORMATIKA	3.66	114	ADAM ALI 	RAHMADIA LASALEMAN 	PERANCANGAN WEBSITE SARANA INFORMASI DAN PROMOSI DESA DODINGA KECAMATAN JAILOLO SELATAN KABUPATEN HALMAHERA BARAT PROVINSI MALUKU UTARA BERBASIS ONLINE	Subhan.S.ST.M.Kom	https://drive.google.com/open?id=1dDEnOYGPSFTAbQN_EvZgh1vzK7a-WTDS	085341536584
032	1245722029	MEUTHYA ARLENITHA ARHAM, Amd.Kom	MANAJEMEN INFORMATIKA	3.63	116	ARHAM GALELA	LENY UMATERNATE	SISTEM INFORMASI GEOGRAFIS (SIG) UNTUK PEMETAAN LOKASI WISATA PADA DINAS PARIWISATA KOTA TERNATE BERBASIS WEBSITE	Abdul Djalil Djayali,ST.,M.Kom	https://drive.google.com/open?id=10_CtEKWP6VJBkr25NBn5qcm_y_NBHjXG	081283814388
033	1245722054	RAHMAT HIDAYAT, Amd.Kom	MANAJEMEN INFORMATIKA	3.53	114	SUPRIATNA NUNU	ROSNAENI	SISTEM INFORMASI JASA LAUNDRY BERBASIS ANDROID DENGAN FRAMEWORK FLUTTER	Rahmawati Nasser,S.Pd., M.Pd	https://drive.google.com/open?id=1Fh3u6Pmc4CP73K7Ovbeu4mzS89uaalYz	082318972256
034	1245722062	SINTA FAHRI, Amd.Kom	MANAJEMEN INFORMATIKA	3.48	114	FAHRI SYAFAR	SAFIA HI. SIBAKIR	PERANCANGAN SISTEM INFORMASI PENGADUAN WARGA BERBASIS MOBILE PADA KANTOR LURAH MANGGA DUA TERNATE SELATAN 	Aswin Abbas, S.Hum.,M.pd	https://drive.google.com/open?id=1b8XiOaQPSQH8KT1-t9AISMHc3qR1Cq7U	082224296953
035	1245722033	MUHAMMAD SANDI M. USMAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.47	114			MEMBUAT MEDIA INTERAKTIF PERANGKAT KERAS KOMPUTER BERBASIS AR MENGGUNAKAN ASSEMBLR STUDIO	Rahmawati Nasser, S.Pd., M.Pd	https://drive.google.com/open?id=1q68RfH0pkT2u6a2UI4oQNgzNw6gWyn5l	082271556906
036	1245722013	FAIQ IBRIY APRITONA HASAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.46	114						
037	1245722041	NURFADILA UMASANGADJI, Amd.Kom	MANAJEMEN INFORMATIKA	3.45	114	YAMIN UMASANGADJI 	WA ODE TINI	PERANCANGAN SISTEM INFORMASI PENGARSIPAN SURAT PADA KANTOR LURAH DUFA-DUFA BERBASIS MOBILE	Muhdar Abdurahman, SE.,M.Kom	https://drive.google.com/open?id=1Qk4DmNvvFbuOEc4RX6mdIq9zKKkQgQ2D	081243309950
038	1245722018	INAYAH MINANGKABAU, Amd.Kom	MANAJEMEN INFORMATIKA	3.38	120	DJUNAIDI MINANGKABAU	YUNITA AHMAD	SISTEM INFORMASI PENGADUAN MASYARAKAT BERBASIS WEBSITE PADA KANTOR LURAH MAKASSAR TIMUR	Muhdar abdurahman, SE., M.Kom	https://drive.google.com/open?id=1QCmbbccRsVbi_jifqrZB3hM_Z87DZYLv	085394035127
039	1245722026	M. RAFLAN J. MAIDING, Amd.Kom	MANAJEMEN INFORMATIKA	3.34	119						#N/A
040	1245722055	RIAN M. UDRUS, Amd.Kom	MANAJEMEN INFORMATIKA	3.31	123						
041	1245722028	MAWARDILA LIMATAHU, Amd.Kom	MANAJEMEN INFORMATIKA	3.3	116	MAHADI LIMATAHU	ISMA ALI	SISTEM INFORMASI RESERVASI HOTEL ARCHIE KOTA TERNATE BERBASIS WEBSITE 	Aswin Abbas,S.Hum.,M.Pd	https://drive.google.com/open?id=1-LHN7fOl7LHANSfC_kQvnlSY_g5MalRY	082291674493
042	1245722022	JAMILA J. MALAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.27	116	JAINUDIN MALAN	NUR MALA TAHER	PENGEMBANGAN SISTEM INFORMASI PENGADUAN PELANGGAN DENGAN FRAMWORK VUR.JS MENGGUNAKAN METODE SPIRAL PADA PERUMDA AKE GALE (PDAM KOTA TERNATE)	MUHDAR ABDURAHMAN, SE.,M.KOM	https://drive.google.com/open?id=1jmNBPeA-Xn6UrYvcIgujwpsz7vvkzqkL	081231249754
043	1245720023	MARLINA ALI, Amd.Kom	MANAJEMEN INFORMATIKA	3.25	121	ALI GULA	NURMINA NADAR	PERANCANGAN SISTEM ABSENSI PEGAWAI BERBASIS WEB GEOLOCATION PADA KANTOR CAMAT PULAU TERNATE 	Muhdar Abdurahman, SE., M.Kom	https://drive.google.com/open?id=1QyXndNqaQycE4Eab1fleRYaVKoTFEeVh	082310376169
044	1245722045	NURNITA MARLINA GOHO, Amd.Kom	MANAJEMEN INFORMATIKA	3.25	131	ARNOLD GOHO	ORPA DEBANG	SISTEM INFORMASI MONITORING KEHADIRAN SISWA BERBASIS MOBILE DI SMA NEGERI 12 PULAU TALIABU	Subhan,S.ST.,M.Kom	https://drive.google.com/open?id=17LUyoWe4WFytcPsw5T8PrJYUmkr3TV8G	081356491851
045	1245722040	NOVRIYANTI RAIS, Amd.Kom	MANAJEMEN INFORMATIKA	3.24	116	RAIS HI SAID	SUNARTI HI DJAINAL	PERANCANGAN SISTEM INFORMASI MONITORING KESEHATAN IBU HAMIL PADA POLI BERSALIN (POLINDES) DI DESA SOMA KECAMATAN PULAU MAKIAN BERBASI MOBILE	Rachmat Saleh Sukur,S.Kom.,M.Kom	https://drive.google.com/open?id=1QOvqMsGVq25gU8J5rbcwbEgd_1lfF49O	081343206779
046	1245722038	NIA AULIYA DARWIN, Amd.Kom	MANAJEMEN INFORMATIKA	3.23	114			PERANCANGAN APLIKASI PENCATATAN HASIL PEMERIKSAAN DAN PENGUJIAN ALAT PADA KANTOR DINAS KEBAKARAN KOTA TERNATE MENGGUNAKAN FRAMEWORK FLUTTER	Rachmat Saleh Sukur, M.Kom	https://drive.google.com/open?id=12TUd4iFNEOCCRRzA8zmMO2jpw-Ezr01-	082137376872
047	1245722077	ARISWAN ALFATIH, Amd.Kom	MANAJEMEN INFORMATIKA	3.23	121						
048	1245722032	MUHAMMAD ISRA JUFRI, Amd.Kom	MANAJEMEN INFORMATIKA	3.21	121	JUFRI RASID	SAIBA M. ZEN	PENGEMBANGAN WEBSITE DOKUMENTASI DAN LAPORAN KEGIATAN PADA BAGIAN PROTOKOL DAN KOMUNIKASI PIMPINAN SETDA KOTA TIDORE KEPULAUAN	Rachmat Saleh Sukur, S.Kom., M.Kom	https://drive.google.com/open?id=1gX_-yLzAbb6kN4PSpq-rp5JehrfBrdac	085395181673
049	1245720016	INDAH WATI BANYAL, Amd.Kom	MANAJEMEN INFORMATIKA	3.19	121	SOLEMAN BANYAL	NURLINA ARIFIN DJABAR 	PERANCANGAN SISTEM INFORMASI LITERASI BERBASIS WEB PADA SMP NEGERI  6 KOTA TERNATE 	Muhdar Abdurahman,SE,M.Kom	https://drive.google.com/open?id=1RbkPP8Lc0Pa1FgKYoSfaOdEboMfHi6wi	081357369859
050	1245722039	NIRMALA ADE, Amd.Kom	MANAJEMEN INFORMATIKA	3.19	121	ALM.ADE MAGRIB 	SAIDA HUSEN 	PERANCANGAN SISTEM INFORMASI APLIKASI MOBILE PADA BALAI PENYULUHAN PERTANIAN DI KECAMATAN JAILOLO SELATAN 	Aswin Abbas, S.Hum.,M.Pd	https://drive.google.com/open?id=1vxJTJk39Q7LF0M0IeraD60vjqcIRCwno	082388115398
051	1245720054	MAHWANI PANIGFAT, Amd.Kom	MANAJEMEN INFORMATIKA	3.18	118	MASHURI PANIGFAT	MAHYANI YOIOGA	APLIKASI PENJUALAN KEDAI KOPI BETA CAFE  BERBASIS MOBILE DENGAN REST API DI DESA WAI IPA, KABUPATEN KEPULAUAN SULA	Muhdar Abdurahman, SE., M. Kom	https://drive.google.com/open?id=1oAOt-N1_Mzrz1Yf2u5IoQoQdCxSrayh_	081242934862
052	1245722014	FARIYATI RUSTAM, Amd.Kom	MANAJEMEN INFORMATIKA	3.15	122	RUSTAM IDRIS 	FATUM HUSEN	PERANCANAGN SISTEM PELAYANAN PENGADUAN MASYARAKAT DI KECAMATAN KAYOA BARAT BERBASIS WEBSITE	Muhdar Abdurahman ,SE.,M.Kom	https://drive.google.com/open?id=18iIvPMFlCMTnjM0QLr4gO26aSZq00wf4	081355045882
053	1245721051	SARNI HAMID, Amd.Kom	MANAJEMEN INFORMATIKA	3.13	127						
054	1245722020	INRIANI R. TUKANG, Amd.Kom	MANAJEMEN INFORMATIKA	3.12	123	RAMLI TUKANG	SAFIYA YUSUF	PERANCANGAN SISTEM INFORMASI PENDATAAN INDUSTRI KECIL DAN MENENGAH(IKM) PADA KANTOR DINAS PERINDUSTRIAN DAN PERDAGANGAN KOTA TERNATE BERBASIS WEBSITE	Rahmawati Nasser, S.pd., M.Pd	https://drive.google.com/open?id=1f9kGWxIquhdEJ0BzgT5SeWtDZK3KIGcA	082236077581
055	1245722005	ASMITA SOFYAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.11	121	SOFYAN AWAL	SUMIATI HASAN	SISTEM DIGITALISASI PELAPORAN NILAI SISWA BERBASIS MOBILE PADA SMA NEGRI 29 HALMAHERA SELATAN	Rachmat Saleh Sukur,.S.Kom.,M.Kom	https://drive.google.com/open?id=19w9jzm3iCesssHnzXvRm-BOZVYtJyJqu	082152835719
056	1245722058	RIZKY RIFALDI KODJA, Amd.Kom	MANAJEMEN INFORMATIKA	3.11	120			SISTEM INFORMASI GEOGRAFIS PELAYANAN BENGKEL MOBIL BERBASIS ANDROID DENGAN FRAMEWORK FLUTTER	Aswin Abbas, S. Hum., M. Pd	https://drive.google.com/open?id=1QjdTpDHP7sq1dZt5ChLDywL_DErfc6Nm	081240925569
057	1245722065	SITI RAMALAH ARAFAT, Amd.Kom	MANAJEMEN INFORMATIKA	3.11	129						
058	1245722070	SUKARTI HJ. RAJAB, Amd.Kom	MANAJEMEN INFORMATIKA	3.11	121	MUHTAR PUASA	MARHAMA SADIK	PERANCANGAN SISTEM INFORMASI SEWA MOTOR BERBASIS ANDROID PADA DUFA-DUFA RENTAL KOTA TERNATE	Muhdar Abdurrahman SE, M. Kom	https://drive.google.com/open?id=1Gkv3oo_DbGutRRIA2vA0NC7eUPssMK-a	0858-4976-1440
059	1245722050	PUTRI BIARO, Amd.Kom	MANAJEMEN INFORMATIKA	3.1	123						
060	1245722048	NURULNISA R DO. BAYAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.08	119	ALM. RASANUDIN DO BAYAN	UMI ALI	SISTEM INFORMASI VIRTUAL TOUR BERBASIS WEBSITE DENGAN MENGGUNAKAN H5P PADA BENTENG KALAMATA	Abdul Djalil Djayali, ST., M. Kom	https://drive.google.com/open?id=18UhdAXFyFnuXbFPCEz8GBd2djdC-Jhrg	085242066459
061	1245722051	PUTRI KARMENITA RIBUTU, Amd.Kom	MANAJEMEN INFORMATIKA	3.06	126	ALFENDRI RIBUTU	YANTI SOLEMAN	PERANCANGAN APLIKASI LAYANAN KESEHATAN BERBASIS ANDROID DI PUSKESMAS IBU KECAMATAN IBU KABUPATEN HALMAHERA BARAT	Abdul Djalil Djayali, ST.,M.Kom	https://drive.google.com/open?id=1bM-u-XAha__S6IBi7glUdDnCNrUj6R5P	085255244098
062	1245720059	WILMAR SANDY SEDENG, Amd.Kom	MANAJEMEN INFORMATIKA	3.05	138						
063	1245721053	SEFFERIO M. TUWONGKESONG, Amd.Kom	MANAJEMEN INFORMATIKA	3.05	124	JONI TUWONGKESONG	ROSYE KASTILONG	PERANCANGAAN SISTEM PENDAFTARAAN KEANGGOTAN UNIT KEGIATAN MAHASISWA (UKM STUASI) BERBASIS WEBSITE	Subhan, S.ST.,M.Kom	https://drive.google.com/open?id=1M95N7XQBqvXTAbyrOJkBeUFFCCFC3KL-	08137773975
064	1245722025	KIKIDASMAWATI ABIDIN, Amd.Kom	MANAJEMEN INFORMATIKA	3.04	121	ABIDIN HI, HARBI SP,D	MARLINA SALEH	PENERIMAAN PEKERJA BERBAIS MOBILE PADA DINAS TENAGA KERJA KOTA TERNATE	Radina Hamza Hairun, SH., MH 	https://drive.google.com/open?id=1xfEGzNTMBctv9ne69QU--ABagyRqz31_	085348678526
065	1245722061	SALMAN ALFARISI ISMAIL, Amd.Kom	MANAJEMEN INFORMATIKA	3.04	119						
066	1245722076	MASRITA RAUF, Amd.Kom	MANAJEMEN INFORMATIKA	3.04	121	RAUF HAMIM	IRMA A BANGSA	PERANCANGAN APLIKASI PEMBELAJARAN BAHASA INGGRIS UNTUK SMP 61 HALMAHERA SELATAN BERBASIS MOBILE NEGERI	Subhan S, ST,M.Kom	https://drive.google.com/open?id=1rzumOUUMqU0OH9sbQHSB-v5ijXzs1Bt_	082284243812
067	1245721056	SITI MAU IDZAH ABDULLAH, Amd.Kom	MANAJEMEN INFORMATIKA	3.03	127	RIDWAN ABDULLAH	JANIMA IDRIS	IMPLEMENTASI CONTENT MANAGEMENT SYSTEM WORDPRESS DALAM PENGEMBANGAN WEBSITE DI MTS NEGERI HALMAHERA BARAT  	Abdul Jalil Jayali, ST .,M.Kom	https://drive.google.com/open?id=1ps39NMdBqzpy1t_yYUisQzaKRyQxDltv	085241051678
068	1245722073	WASAYANG KASMAN, Amd.Kom	MANAJEMEN INFORMATIKA	3.03	120	KASMAN	WAODE YANA	PERANCANGAN APLIKASI MOBILE UNTUK PELAYANAN GIZI BALITA PUSTU PADA DESA PASIPALELE HALMAGERA SELATAN	Rahmawati Nasser, S.Pd., M.Pd	https://drive.google.com/open?id=12WAHKGAgudGF5po5c_vOyFo1EY7iosVC	081244386302
069	1245722057	RIFKI RUSTAM, Amd.Kom	MANAJEMEN INFORMATIKA	3.02	123	RUSTAM MUHAMMAD 	RINA SUKUR	PERANCANGAN APLIKASI PENGOLAHAN DAN PENJUALAN KOPRA DI DESA LAROMABATI KEC. KAYOA UTARA HALMAHERA SELATAN    	Subhan, S.ST.,Kom	https://drive.google.com/open?id=1mRkBCBEVjnTsU_ZC_2jwKGdYb__ptxAC	085343920391
070	1245721041	NURUL TAHMIRA TOGUBU, Amd.Kom	MANAJEMEN INFORMATIKA	3.01	118						
071	1245722021	IRAWAN HAMADALI, Amd.Kom	MANAJEMEN INFORMATIKA	3.01	123	HAMADALI SIRAJU	SUMIYATI KADIR	PERANCANGAN SHARING PRINTER DENGAN METODE NDCL (NETWORK DEVELOPMENT LIFE CYCLE) PADA SEKOLAH MADRASYAH ALIYAH SWASTA WAIKYON (MAS)	Akil Thalib, S.ST.,M.Kom	https://drive.google.com/open?id=1zekaXmLca5iT1CIbUyge62kIaA8F5g06	081243582321
072	1245722075	DIAS ARYO SAHRUDIN, Amd.Kom	MANAJEMEN INFORMATIKA	2.98	114`;

  const lines = RAW_TSV.trim().split("\n");
  const graduates: Graduate[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    if (cols.length < 3) continue;

    const seatRaw = cols[0]?.trim() || "";
    const seatCode = /^\d+$/.test(seatRaw) ? seatRaw.padStart(3, "0") : seatRaw;
    const nim = cols[1]?.trim() || "";
    const namaGelar = cols[2]?.trim() || "";

    const nameParts = namaGelar.split(",");
    const name = nameParts[0]?.trim() || namaGelar;
    const gelar = nameParts[1]?.trim() || "";

    const prodi = cols[3]?.trim() || "MANAJEMEN INFORMATIKA";
    const ipk = cols[4]?.trim() || "";
    const sks = cols[5]?.trim() || "";
    const ayah = cols[6]?.trim() || "";
    const ibu = cols[7]?.trim() || "";
    const judul = cols[8]?.trim() || "";
    const pembimbing = cols[9]?.trim() || "";
    const foto = cols[10]?.trim() || "";
    const noWa = cols[11]?.trim() || "";

    // Map prodi to Faculty with normalization
    let faculty = "Fakultas Teknik";
    if (prodi.toUpperCase().includes("MANAJEMEN") || prodi.toUpperCase().includes("INFORMATIKA")) {
      faculty = "Fakultas Informatika";
    }

    graduates.push({
      id: nim,
      nim,
      name: namaGelar,
      prodi,
      faculty,
      seatCode,
      isPresent: false,
      gelar: sanitize(gelar) || undefined,
      ipk: sanitize(ipk) || undefined,
      sks: sanitize(sks) || undefined,
      ayah: sanitize(ayah) || undefined,
      ibu: sanitize(ibu) || undefined,
      judul: sanitize(judul) || undefined,
      pembimbing: sanitize(pembimbing) || undefined,
      foto: sanitize(foto) || undefined,
      noWa: sanitize(noWa) || undefined,
    });
  }

  return graduates;
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DATA_FILE = path.join(process.cwd(), "graduates.json");

  app.use(express.json({ limit: '10mb' }));

  // Load graduates from file or seed default
  let graduates: Graduate[] = [];
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, "utf-8");
      graduates = JSON.parse(fileData);
      // Normalize faculty names of any loaded graduates
      let modified = false;
      graduates = graduates.map(g => {
        let fac = g.faculty || "";
        const originalFac = fac;
        const facUpper = fac.toUpperCase();
        const prodUpper = (g.prodi || "").toUpperCase();
        if (facUpper.includes("INFORMATIK")) {
          fac = "Fakultas Informatika";
        } else if (facUpper.includes("TEKNIK") || facUpper.includes("ITEKNIK")) {
          fac = "Fakultas Teknik";
        } else if (prodUpper.includes("MANAJEMEN") || prodUpper.includes("INFORMATIKA")) {
          fac = "Fakultas Informatika";
        } else if (prodUpper.includes("KOMPUTER") || prodUpper.includes("TEKNIK")) {
          fac = "Fakultas Teknik";
        } else {
          fac = "Fakultas Informatika";
        }
        if (fac !== originalFac) {
          modified = true;
        }
        return { ...g, faculty: fac };
      });
      if (modified) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(graduates, null, 2));
      }
    } else {
      graduates = generateDefaultGraduates();
      fs.writeFileSync(DATA_FILE, JSON.stringify(graduates, null, 2));
    }
  } catch (error) {
    console.error("Failed to load graduates database, seeding default", error);
    graduates = generateDefaultGraduates();
  }

  // Live clients for SSE
  let sseClients: express.Response[] = [];
  let recentLogs: ActivityLog[] = [];

  const broadcastUpdate = (type: string, data: any) => {
    sseClients.forEach((client) => {
      client.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  };

  const saveData = () => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(graduates, null, 2));
    } catch (err) {
      console.error("Error saving graduates database", err);
    }
  };

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // SSE Live Endpoint
  app.get("/api/live", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.push(res);

    // Send initial status immediately
    res.write(`event: init\ndata: ${JSON.stringify({ graduates, logs: recentLogs })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  // Get all graduates
  app.get("/api/graduates", (req, res) => {
    res.json(graduates);
  });

  // Update attendance of a graduate
  app.put("/api/graduates/:id/presence", (req, res) => {
    const { id } = req.params;
    const { isPresent } = req.body;

    const graduateIndex = graduates.findIndex((g) => g.id === id);
    if (graduateIndex === -1) {
      return res.status(404).json({ error: "Graduand not found" });
    }

    const currentGraduate = graduates[graduateIndex];
    
    // Check if there is an actual state change
    if (currentGraduate.isPresent !== isPresent) {
      currentGraduate.isPresent = isPresent;
      currentGraduate.checkedInAt = isPresent ? new Date().toISOString() : undefined;

      // Add to logs
      const logEntry: ActivityLog = {
        id: Math.random().toString(36).substring(2, 9),
        graduateId: currentGraduate.id,
        graduateName: currentGraduate.name,
        seatCode: currentGraduate.seatCode,
        timestamp: new Date().toISOString(),
        action: isPresent ? "check-in" : "check-out",
      };

      recentLogs.unshift(logEntry);
      if (recentLogs.length > 50) {
        recentLogs = recentLogs.slice(0, 50);
      }

      saveData();

      // Broadcast changes to all AV screens and receptionists
      broadcastUpdate("presence_update", { graduate: currentGraduate, log: logEntry });
    }

    res.json(currentGraduate);
  });

  // Bulk update / import graduates (e.g. from Google Sheets or CSV)
  app.post("/api/graduates/bulk", (req, res) => {
    const { list } = req.body;

    if (!Array.isArray(list)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    // Validate and clean imported list
    const validatedList: Graduate[] = list.map((item: any, idx) => {
      return {
        id: item.id || item.nim || `G-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        nim: String(item.nim || item.id || `NIM-${idx}`),
        name: String(item.name || "Tanpa Nama"),
        prodi: String(item.prodi || "Umum"),
        faculty: (() => {
          const rawFac = String(item.faculty || "").trim();
          const rawProd = String(item.prodi || "").trim().toUpperCase();
          const facUpper = rawFac.toUpperCase();
          if (facUpper.includes("INFORMATIK")) {
            return "Fakultas Informatika";
          }
          if (facUpper.includes("TEKNIK") || facUpper.includes("ITEKNIK")) {
            return "Fakultas Teknik";
          }
          if (rawProd.includes("MANAJEMEN") || rawProd.includes("INFORMATIKA")) {
            return "Fakultas Informatika";
          }
          if (rawProd.includes("KOMPUTER") || rawProd.includes("TEKNIK")) {
            return "Fakultas Teknik";
          }
          return rawFac || "Fakultas Informatika";
        })(),
        seatCode: String(item.seatCode || "").trim().toUpperCase(),
        isPresent: item.isPresent === true || String(item.isPresent).toLowerCase() === "true" || String(item.isPresent) === "1",
        checkedInAt: item.checkedInAt || (item.isPresent ? new Date().toISOString() : undefined),
        gelar: item.gelar ? String(item.gelar) : undefined,
        ipk: item.ipk ? String(item.ipk) : undefined,
        sks: item.sks ? String(item.sks) : undefined,
        ayah: item.ayah ? String(item.ayah) : undefined,
        ibu: item.ibu ? String(item.ibu) : undefined,
        judul: item.judul ? String(item.judul) : undefined,
        pembimbing: item.pembimbing ? String(item.pembimbing) : undefined,
        foto: item.foto ? String(item.foto) : undefined,
        noWa: item.noWa ? String(item.noWa) : undefined,
      };
    });

    graduates = validatedList;
    saveData();

    // Log this action
    const logEntry: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      graduateId: "system",
      graduateName: "Panitia",
      seatCode: "BULK",
      timestamp: new Date().toISOString(),
      action: "check-in", // General update
    };
    recentLogs.unshift(logEntry);

    broadcastUpdate("bulk_update", { graduates, log: logEntry });

    res.json({ message: `Successfully loaded ${validatedList.length} graduates.`, count: validatedList.length });
  });

  // Get activity logs
  app.get("/api/logs", (req, res) => {
    res.json(recentLogs);
  });

  // Reset database to default template
  app.post("/api/reset", (req, res) => {
    graduates = generateDefaultGraduates();
    recentLogs = [];
    saveData();
    broadcastUpdate("bulk_update", { graduates, log: null });
    res.json({ message: "Database reset to default sample data.", count: graduates.length });
  });

  // -------------------------------------------------------------
  // Vite Integration
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
