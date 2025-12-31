#set document(title: "Plano de Leitura 2026-2027", author: "Pedro")
#set page(paper: "a4", margin: (x: 1.5cm, y: 1.5cm))
#set text(font: "Linux Libertine", size: 9pt, lang: "pt")
#set heading(numbering: "1.")

#let azul = rgb("#1F4E79")
#let dourado = rgb("#FFE699")
#let roxo = rgb("#7030A0")
#let verde = rgb("#C6EFCE")

#align(center)[
  #text(size: 20pt, weight: "bold", fill: azul)[Plano de Leitura 2026–2027]
  
  #text(size: 11pt, style: "italic")[53 livros · ~18.000 páginas · 104 semanas]
  
  #v(0.3cm)
  
  #rect(fill: rgb("#E2D4F0"), radius: 4pt, inset: 8pt)[
    #text(size: 9pt)[*Leitura Noturna (20 min antes de dormir):* _Vida de Cristo_ — Fulton Sheen — ~5 págs/dia]
  ]
]

#v(0.5cm)

= Estrutura do Plano

#grid(
  columns: (1fr, 1fr, 1fr),
  gutter: 12pt,
  rect(fill: rgb("#E2D4F0").lighten(30%), radius: 3pt, inset: 8pt)[
    *Noturna* (20 min)\
    Vida de Cristo\
    ~5 págs/dia\
    Meditativa
  ],
  rect(fill: azul.lighten(70%), radius: 3pt, inset: 8pt)[
    *Espiritual* (diurna)\
    ~12 págs/dia\
    ~85 págs/semana\
    20 livros
  ],
  rect(fill: verde, radius: 3pt, inset: 8pt)[
    *Secular* (diurna)\
    ~12 págs/dia\
    ~85 págs/semana\
    Literatura/Filosofia
  ],
)

#v(0.5cm)

= Cronograma Semanal — Ano 1 (2026)

#let header-fill = azul
#let header-text = white

== Bloco 1: Fundamentos da Fé (Janeiro–Fevereiro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [1 (6–12 Jan)], [_Cristianismo puro e simples_ (Lewis) — p. 1–58], [_Por que ler os clássicos_ (Calvino) — p. 1–56], [],
  [2 (13–19 Jan)], [Lewis — p. 59–116], [Calvino — p. 57–112], [],
  [3 (20–26 Jan)], [Lewis — p. 117–174], [Calvino — p. 113–168], [],
  [4 (27 Jan–2 Fev)], [Lewis — p. 175–232], [Calvino — p. 169–224], [],
  [5 (3–9 Fev)], [Lewis — p. 233–288 ✓], [Calvino — p. 225–279 ✓], [],
  [6 (10–16 Fev)], [_Cartas de um diabo_ (Lewis) — p. 1–42], [_Memórias póstumas_ (Machado) — p. 1–66], [],
  [7 (17–23 Fev)], [Cartas — p. 43–84], [Memórias — p. 67–132], [],
  [8 (24 Fev–2 Mar)], [Cartas — p. 85–126], [Memórias — p. 133–198], [],
  [9 (3–9 Mar)], [Cartas — p. 127–168], [Memórias — p. 199–264], [],
  [10 (10–16 Mar)], [Cartas — p. 169–208 ✓], [Memórias — p. 265–332 ✓], [],
)

== Bloco 2: Pessoa e Antropologia (Março–Abril)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [11 (17–23 Mar)], [_A abolição do homem_ (Lewis) — p. 1–26], [_Fundamentos de antropologia_ (Yepes) — p. 1–76], [],
  [12 (24–30 Mar)], [Abolição — p. 27–52], [Fundamentos — p. 77–152], [],
  [13 (31 Mar–6 Abr)], [Abolição — p. 53–78], [Fundamentos — p. 153–228], [],
  [14 (7–13 Abr)], [Abolição — p. 79–104], [Fundamentos — p. 229–304], [],
  [15 (14–20 Abr)], [Abolição — p. 105–128 ✓], [Fundamentos — p. 305–380 ✓], [],
  [16 (21–27 Abr)], [_Confissões de um Converso_ (Benson) — p. 1–45], [_Personalismo_ (Mounier) — p. 1–46], [],
  [17 (28 Abr–4 Mai)], [Confissões — p. 46–90], [Personalismo — p. 47–92], [],
  [18 (5–11 Mai)], [Confissões — p. 91–136 ✓], [Personalismo — p. 93–139 ✓], [],
  [19 (12–18 Mai)], [_Gabriel Marcel e Edith Stein_ (Zilles) — p. 1–32], [_Antropologia de Mounier_ (Severino) — p. 1–53], [],
  [20 (19–25 Mai)], [Zilles — p. 33–64], [Severino — p. 54–106], [],
  [21 (26 Mai–1 Jun)], [Zilles — p. 65–94 ✓], [Severino — p. 107–158 ✓], [],
)

== Bloco 3: Vida Interior I (Maio–Junho)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [22 (2–8 Jun)], [_As Moradas do Castelo Interior_ (Teresa) — p. 1–64], [_Mapa do mundo pessoal_ (Marías) — p. 1–37], [],
  [23 (9–15 Jun)], [Moradas — p. 65–128], [Mapa — p. 38–74], [],
  [24 (16–22 Jun)], [Moradas — p. 129–192], [Mapa — p. 75–111], [],
  [25 (23–29 Jun)], [Moradas — p. 193–254 ✓], [Mapa — p. 112–148 ✓], [],
  [26 (30 Jun–6 Jul)], [_São Bernardo de Claraval_ (Daniel-Rops) — p. 1–32], [_A educação sentimental_ (Marías) — p. 1–60], [],
  [27 (7–13 Jul)], [São Bernardo — p. 33–64], [Educação — p. 61–120], [],
  [28 (14–20 Jul)], [São Bernardo — p. 65–96], [Educação — p. 121–180], [],
  [29 (21–27 Jul)], [São Bernardo — p. 97–128 ✓], [Educação — p. 181–240 ✓], [],
)

== Bloco 4: Cristo e a História (Julho–Agosto)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [30 (28 Jul–3 Ago)], [_Introdução ao Cristianismo_ (Ratzinger) — p. 1–54], [_O mito do Papa de Hitler_ (Dalin) — p. 1–45], [],
  [31 (4–10 Ago)], [Introdução — p. 55–108], [Mito — p. 46–90], [],
  [32 (11–17 Ago)], [Introdução — p. 109–162], [Mito — p. 91–135], [],
  [33 (18–24 Ago)], [Introdução — p. 163–216], [Mito — p. 136–180], [],
  [34 (25–31 Ago)], [Introdução — p. 217–272 ✓], [Mito — p. 181–224 ✓], [],
  [35 (1–7 Set)], [_Relatório sobre a fé_ (Messori/Ratzinger) — p. 1–54], [_Comunismo_ (Genta) — p. 1–40], [],
  [36 (8–14 Set)], [Relatório — p. 55–108], [Comunismo — p. 41–80], [],
  [37 (15–21 Set)], [Relatório — p. 109–162], [Comunismo — p. 81–120], [],
  [38 (22–28 Set)], [Relatório — p. 163–216], [Comunismo — p. 121–160], [],
  [39 (29 Set–5 Out)], [Relatório — p. 217–272 ✓], [Comunismo — p. 161–200 ✓], [],
)

== Bloco 5: Literatura Russa — Parte 1 (Setembro–Outubro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [40 (6–12 Out)], [_A vida vale a pena ser vivida_ (Sheen) — p. 1–46], [_Dostoievski: Sementes da revolta_ (Frank) — p. 1–55], [],
  [41 (13–19 Out)], [Vida vale — p. 47–92], [Sementes — p. 56–110], [],
  [42 (20–26 Out)], [Vida vale — p. 93–138], [Sementes — p. 111–165], [],
  [43 (27 Out–2 Nov)], [Vida vale — p. 139–184], [Sementes — p. 166–220], [],
  [44 (3–9 Nov)], [Vida vale — p. 185–230], [Sementes — p. 221–275], [],
  [45 (10–16 Nov)], [Vida vale — p. 231–276], [Sementes — p. 276–330], [],
  [46 (17–23 Nov)], [Vida vale — p. 277–322], [Sementes — p. 331–385], [],
  [47 (24–30 Nov)], [Vida vale — p. 323–368], [Sementes — p. 386–440], [],
  [48 (1–7 Dez)], [Vida vale — p. 369–416 ✓], [Sementes — p. 441–496 ✓], [],
)

== Bloco 6: Amor e Vocação (Novembro–Dezembro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [49 (8–14 Dez)], [_Cartas de Amor de uma Santa_ (Molla) — p. 1–36], [_A última ao cadafalso_ (Le Fort) — p. 1–48], [],
  [50 (15–21 Dez)], [Cartas — p. 37–72], [Cadafalso — p. 49–96], [],
  [51 (22–28 Dez)], [Cartas — p. 73–108], [Cadafalso — p. 97–144], [],
  [52 (29 Dez–4 Jan)], [Cartas — p. 109–144 ✓], [Cadafalso — p. 145–192 ✓], [],
)

#pagebreak()

#align(center)[
  #text(size: 16pt, weight: "bold", fill: azul)[Ano 2 — 2027]
]

#v(0.3cm)

== Bloco 6 (cont.): Amor e Responsabilidade (Janeiro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [53 (5–11 Jan)], [_Amor e responsabilidade_ (Wojtyla) — p. 1–50], [_Otelo_ (Shakespeare) — p. 1–47], [],
  [54 (12–18 Jan)], [Amor — p. 51–100], [Otelo — p. 48–94], [],
  [55 (19–25 Jan)], [Amor — p. 101–150], [Otelo — p. 95–141], [],
  [56 (26 Jan–1 Fev)], [Amor — p. 151–200], [Otelo — p. 142–188], [],
  [57 (2–8 Fev)], [Amor — p. 201–250], [Otelo — p. 189–235], [],
  [58 (9–15 Fev)], [Amor — p. 251–300], [Otelo — p. 236–282], [],
  [59 (16–22 Fev)], [Amor — p. 301–354 ✓], [Otelo — p. 283–328 ✓], [],
)

== Bloco 7: Literatura Russa — Parte 2 (Fevereiro–Abril)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [60 (23 Fev–1 Mar)], [_Caminhar com Jesus_ (del Portillo) — p. 1–42], [_Dostoievski: Anos de provação_ (Frank) — p. 1–53], [],
  [61 (2–8 Mar)], [Caminhar — p. 43–84], [Provação — p. 54–106], [],
  [62 (9–15 Mar)], [Caminhar — p. 85–126], [Provação — p. 107–159], [],
  [63 (16–22 Mar)], [Caminhar — p. 127–168], [Provação — p. 160–212], [],
  [64 (23–29 Mar)], [Caminhar — p. 169–210], [Provação — p. 213–265], [],
  [65 (30 Mar–5 Abr)], [Caminhar — p. 211–252], [Provação — p. 266–318], [],
  [66 (6–12 Abr)], [Caminhar — p. 253–294], [Provação — p. 319–371], [],
  [67 (13–19 Abr)], [Caminhar — p. 295–336 ✓], [Provação — p. 372–424 ✓], [],
  [68 (20–26 Abr)], [_As cerejeiras em flor_ (Cejas) — p. 1–41], [_Dostoievski: Efeitos da libertação_ (Frank) — p. 1–59], [],
  [69 (27 Abr–3 Mai)], [Cerejeiras — p. 42–82], [Libertação — p. 60–118], [],
  [70 (4–10 Mai)], [Cerejeiras — p. 83–123], [Libertação — p. 119–177], [],
  [71 (11–17 Mai)], [Cerejeiras — p. 124–164], [Libertação — p. 178–236], [],
  [72 (18–24 Mai)], [Cerejeiras — p. 165–205], [Libertação — p. 237–295], [],
  [73 (25–31 Mai)], [Cerejeiras — p. 206–246], [Libertação — p. 296–354], [],
  [74 (1–7 Jun)], [Cerejeiras — p. 247–287], [Libertação — p. 355–413], [],
  [75 (8–14 Jun)], [Cerejeiras — p. 288–328], [Libertação — p. 414–472], [],
  [76 (15–21 Jun)], [Cerejeiras — p. 329–368 ✓], [Libertação — p. 473–528 ✓], [],
)

== Bloco 8: Economia e Sociedade (Junho–Agosto)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [77 (22–28 Jun)], [_A economia das parábolas_ (Sirico) — p. 1–31], [_A Grande Depressão_ (Rothbard) — p. 1–63], [],
  [78 (29 Jun–5 Jul)], [Parábolas — p. 32–62], [Depressão — p. 64–126], [],
  [79 (6–12 Jul)], [Parábolas — p. 63–93], [Depressão — p. 127–189], [],
  [80 (13–19 Jul)], [Parábolas — p. 94–124], [Depressão — p. 190–252], [],
  [81 (20–26 Jul)], [Parábolas — p. 125–155], [Depressão — p. 253–315], [],
  [82 (27 Jul–2 Ago)], [Parábolas — p. 156–184 ✓], [Depressão — p. 316–378 ✓], [],
  [83 (3–9 Ago)], [_Cristianismo e economia_ (Gasda) — p. 1–45], [_Manual do Perfeito Idiota_ — p. 1–52], [],
  [84 (10–16 Ago)], [Crist. economia — p. 46–90], [Manual — p. 53–104], [],
  [85 (17–23 Ago)], [Crist. economia — p. 91–135], [Manual — p. 105–156], [],
  [86 (24–30 Ago)], [Crist. economia — p. 136–180], [Manual — p. 157–208], [],
  [87 (31 Ago–6 Set)], [Crist. economia — p. 181–225], [Manual — p. 209–260], [],
  [88 (7–13 Set)], [Crist. economia — p. 226–270], [Manual — p. 261–312], [],
  [89 (14–20 Set)], [Crist. economia — p. 271–312 ✓], [Manual — p. 313–364 ✓], [],
)

== Bloco 9: Pensamento e Cultura (Setembro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [90 (21–27 Set)], [_O que há de errado com o mundo_ (Chesterton) — p. 1–55], [_As ideias têm consequências_ (Weaver) — p. 1–52], [],
  [91 (28 Set–4 Out)], [Errado — p. 56–110], [Ideias — p. 53–104], [],
  [92 (5–11 Out)], [Errado — p. 111–165], [Ideias — p. 105–156], [],
  [93 (12–18 Out)], [Errado — p. 166–218 ✓], [Ideias — p. 157–208 ✓], [],
)

== Bloco 10: Literatura Russa — Parte 3 (Outubro–Novembro)

#table(
  columns: (auto, 1fr, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Semana],
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[☐],
  ),
  [94 (19–25 Out)], [_O Catecismo_ (Sheen) — p. 1–49], [_Dostoievski: Anos milagrosos_ (Frank) — p. 1–51], [],
  [95 (26 Out–1 Nov)], [Catecismo — p. 50–98], [Milagrosos — p. 52–102], [],
  [96 (2–8 Nov)], [Catecismo — p. 99–147], [Milagrosos — p. 103–153], [],
  [97 (9–15 Nov)], [Catecismo — p. 148–196], [Milagrosos — p. 154–204], [],
  [98 (16–22 Nov)], [Catecismo — p. 197–245], [Milagrosos — p. 205–255], [],
  [99 (23–29 Nov)], [Catecismo — p. 246–294], [Milagrosos — p. 256–306], [],
  [100 (30 Nov–6 Dez)], [Catecismo — p. 295–343], [Milagrosos — p. 307–357], [],
  [101 (7–13 Dez)], [Catecismo — p. 344–392], [Milagrosos — p. 358–408], [],
  [102 (14–20 Dez)], [Catecismo — p. 393–441], [Milagrosos — p. 409–459], [],
  [103 (21–27 Dez)], [Catecismo — p. 442–490], [Milagrosos — p. 460–510], [],
  [104 (28 Dez–3 Jan)], [Catecismo — p. 491–540], [Milagrosos — p. 511–561], [],
)

#pagebreak()

= Leituras para 2028+ (Continuação)

#text(size: 9pt, style: "italic")[Os livros abaixo não couberam no cronograma de 104 semanas. Podem ser iniciados em 2028 ou intercalados se houver semanas de folga.]

#v(0.3cm)

#table(
  columns: (1fr, auto, 1fr, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { azul } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(fill: white, weight: "bold")[Livro Espiritual],
    text(fill: white, weight: "bold")[Págs],
    text(fill: white, weight: "bold")[Livro Secular],
    text(fill: white, weight: "bold")[Págs],
  ),
  [_Teologia do Corpo_ (João Paulo II)], [542], [_50 contos de Machado_ (org. Gledson)], [496],
  [_Summa Daemoniaca_ (Fortea)], [336], [_Dostoievski: Manto do profeta_ (Frank)], [952],
  [_Suma contra os gentios_ (Tomás de Aquino)], [778], [_História da educação_ (Giles)], [302],
  [_São João da Cruz: Obras completas_], [1152], [_Viagem a Alfa Centauri_ (O'Brien)], [608],
  [—], [—], [_A ladeira da memória_ (J.G. Vieira)], [364],
)

#v(0.5cm)

= Leituras Complementares (Flexíveis)

#text(size: 9pt)[Livros curtos para intercalar como "respiro" ou em semanas mais leves:]

#v(0.2cm)

#table(
  columns: (1fr, auto, auto),
  inset: 6pt,
  fill: (col, row) => if row == 0 { verde } else if calc.odd(row) { rgb("#F2F2F2") } else { white },
  table.header(
    text(weight: "bold")[Título],
    text(weight: "bold")[Autor],
    text(weight: "bold")[Págs],
  ),
  [_Categorias_], [Aristóteles], [64],
  [_Retórica a Alexandre_], [Aristóteles], [128],
  [_Meditações do Quixote_], [Ortega y Gasset], [160],
  [_Pessoas_], [Robert Spaemann], [198],
  [_O Corpo Fala_], [Weil & Tompakow], [288],
  [_Probabilidade e certeza_], [E. Borel], [135],
  [_Zé Batalha_], [Alberico Rodrigues], [107],
)

#v(0.8cm)

#rect(fill: rgb("#E2D4F0"), radius: 4pt, inset: 10pt, width: 100%)[
  #align(center)[
    #text(size: 10pt, weight: "bold")[📖 Leitura Noturna — Vida de Cristo (Sheen)]
    
    #v(0.2cm)
    
    #text(size: 9pt)[
      *1015 páginas* · ~5 páginas/dia · *~7 meses* para completar
      
      #v(0.1cm)
      
      _Início:_ Janeiro 2026 · _Término estimado:_ Julho 2026
      
      #v(0.1cm)
      
      Após terminar: reiniciar ou passar para _São João da Cruz_ (leitura contemplativa)
    ]
  ]
]

#v(0.5cm)

#line(length: 100%, stroke: 0.5pt + gray)

#v(0.3cm)

#align(center)[
  #text(size: 8pt, fill: gray)[
    _Plano gerado em dezembro de 2025 · Ritmo: ~170 páginas/semana (paralelas) + ~35 páginas/semana (noturna)_
  ]
]
