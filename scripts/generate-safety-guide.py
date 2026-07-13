from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak, NextPageTemplate, Image, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client/public/downloads/guida-incontri-consapevoli.pdf"
IMG_COVER = ROOT / "client/public/images/guida-incontri-home.jpg"
IMG_MEETING = ROOT / "client/public/images/guida-sicurezza-incontro.jpg"

NAVY = HexColor("#100B22")
INK = HexColor("#211A33")
VIOLET = HexColor("#7C3AED")
PINK = HexColor("#EC4899")
PALE = HexColor("#F5F1FF")
MUTED = HexColor("#6B6478")

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DV-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(HexColor("#FCFAFF"))
    canvas.rect(0, 0, A5[0], A5[1], fill=1, stroke=0)
    canvas.setFillColor(VIOLET)
    canvas.rect(0, A5[1] - 7, A5[0], 7, fill=1, stroke=0)
    canvas.setFont("DV", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(28, 18, "INCONTRI DI BAKEKA  /  PRIMA TU. SEMPRE.")
    canvas.drawRightString(A5[0] - 28, 18, str(doc.page))
    canvas.restoreState()

def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, A5[0], A5[1], fill=1, stroke=0)
    im = ImageReader(str(IMG_COVER))
    iw, ih = im.getSize()
    h = A5[1] * .58
    w = h * iw / ih
    canvas.drawImage(im, A5[0] - w * .86, 0, w, h, mask='auto')
    canvas.setFillColor(HexColor("#A78BFA"))
    canvas.setFont("DV-Bold", 8)
    canvas.drawString(30, A5[1] - 48, "GUIDA GRATUITA  /  EDIZIONE 2026")
    canvas.setFillColor(white)
    canvas.setFont("DV-Bold", 29)
    canvas.drawString(30, A5[1] - 105, "PRIMA TU.")
    canvas.drawString(30, A5[1] - 139, "SEMPRE.")
    canvas.setFillColor(HexColor("#F9A8D4"))
    canvas.setFont("DV-Bold", 13)
    canvas.drawString(30, A5[1] - 173, "Incontri consapevoli")
    canvas.setFillColor(HexColor("#DDD6FE"))
    canvas.setFont("DV", 9)
    canvas.drawString(30, A5[1] - 193, "Privacy, confini, benessere e risorse utili")
    canvas.setFont("DV-Bold", 9)
    canvas.setFillColor(white)
    canvas.drawString(30, 27, "INCONTRI DI BAKEKA")
    canvas.restoreState()

styles = {
    "eyebrow": ParagraphStyle("eyebrow", fontName="DV-Bold", fontSize=8, leading=11, textColor=PINK, spaceAfter=8),
    "h1": ParagraphStyle("h1", fontName="DV-Bold", fontSize=24, leading=27, textColor=INK, spaceAfter=14),
    "h2": ParagraphStyle("h2", fontName="DV-Bold", fontSize=16, leading=20, textColor=INK, spaceBefore=6, spaceAfter=8),
    "body": ParagraphStyle("body", fontName="DV", fontSize=9.3, leading=14, textColor=INK, spaceAfter=8),
    "small": ParagraphStyle("small", fontName="DV", fontSize=7.3, leading=10.5, textColor=MUTED, spaceAfter=5),
    "call": ParagraphStyle("call", fontName="DV-Bold", fontSize=10, leading=14, textColor=VIOLET),
    "center": ParagraphStyle("center", fontName="DV-Bold", fontSize=14, leading=18, textColor=white, alignment=TA_CENTER),
}

def p(txt, style="body"): return Paragraph(txt, styles[style])
def bullet(title, text):
    return Table([[Paragraph("●", ParagraphStyle("dot", fontName="DV-Bold", fontSize=10, textColor=PINK)), p(f"<b>{title}</b><br/>{text}")]], colWidths=[13, 313], style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
def card(title, text):
    t = Table([[p(title,"call")], [p(text,"body")]], colWidths=[326])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.6,HexColor('#DDD6FE')),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return t

doc = BaseDocTemplate(str(OUT), pagesize=A5, rightMargin=28, leftMargin=28, topMargin=34, bottomMargin=32, title="Prima tu. Sempre. - Incontri consapevoli", author="Incontri di Bakeka")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='body')
doc.addPageTemplates([PageTemplate(id='cover', frames=frame, onPage=cover), PageTemplate(id='body', frames=frame, onPage=page_bg)])

story = [NextPageTemplate('body'), PageBreak()]
story += [p("UNA GUIDA CHE PARTE DA TE", "eyebrow"), p("Consapevolezza, non paura", "h1"), p("Queste pagine sono pensate per persone adulte che organizzano incontri tramite annunci o messaggi online. Non giudicano le tue scelte e non promettono rischio zero: offrono strumenti semplici per decidere con più informazioni e mantenere il controllo."), card("La regola più importante", "Puoi cambiare idea in qualsiasi momento. Un sì dato prima non elimina il diritto di fermarti dopo. Pressione, fretta e ricatto non sono consenso."), Spacer(1,10), p("La guida non sostituisce assistenza medica, legale o delle autorità. In un pericolo immediato chiama il <b>112</b>."), p("Contenuti originali ispirati ai principi di riduzione del rischio. Ultimo aggiornamento: luglio 2026.","small"), PageBreak()]
story += [p("01  /  PRIMA DI USCIRE", "eyebrow"), p("Prepara un piano leggero", "h1"), bullet("Verifica senza esporti", "Fai una breve videochiamata o chiedi un segnale concordato. Non condividere documenti, indirizzo di casa o dati bancari."), bullet("Persona fidata", "Invia luogo, orario e durata prevista a qualcuno di fiducia. Concordate una parola neutra che significhi 'chiamami' e una che significhi 'serve aiuto'."), bullet("Trasporto autonomo", "Se possibile organizza andata e ritorno senza dipendere dall'altra persona. Tieni batteria e credito sufficienti."), bullet("Confini chiari", "Scrivi prima cosa accetti, cosa non accetti, durata, luogo e condizioni. Uno screenshot può evitare equivoci."), card("Check in 30 secondi", "Telefono carico · posizione condivisa solo con chi scegli · contatto fidato avvisato · uscita individuata · nessun documento originale consegnato."), PageBreak()]
story += [p("02  /  PRIVACY DIGITALE", "eyebrow"), p("Separa ciò che vuoi tenere separato", "h1"), bullet("Account dedicato", "Usa email e numero separati quando serve. Attiva autenticazione a due fattori e password uniche."), bullet("Foto consapevoli", "Controlla sfondi, specchi, tatuaggi, targhe e metadati. Evita dettagli che rivelano casa, routine o persone vicine."), bullet("Pagamenti e link", "Non comunicare OTP, PIN, password o codici di recupero. Non installare app su richiesta di sconosciuti e non aprire link sospetti."), bullet("Conserva le prove", "In caso di minacce salva chat, username, URL, date e screenshot in un luogo sicuro prima di bloccare."), card("Contenuti intimi diffusi senza consenso", "Puoi segnalare la situazione alla piattaforma e rivolgerti al Garante per la protezione dei dati personali. In caso di minacce o reato, contatta le autorità."), PageBreak()]
story += [p("03  /  LUOGO E INCONTRO", "eyebrow"), p("Mantieni sempre un'uscita", "h1"), Image(str(IMG_MEETING), width=326, height=183), Spacer(1,10), bullet("Arriva lucido", "Evita sostanze che riducono attenzione e capacità di decidere. Non lasciare bevande incustodite."), bullet("Leggi l'ambiente", "Individua uscita, reception, personale o zone frequentate. Tieni oggetti essenziali facilmente raggiungibili."), bullet("Ascolta il cambiamento", "Se tono, condizioni o persone presenti non corrispondono a quanto concordato, fermati e vai via."), PageBreak()]
story += [p("04  /  CONSENSO E CONFINI", "eyebrow"), p("Chiaro, specifico, reversibile", "h1"), card("Il consenso non si presume", "Deve essere libero, informato e presente. Può valere per una cosa e non per un'altra; può essere ritirato in ogni momento."), Spacer(1,10), bullet("Nessuna negoziazione sotto pressione", "Fretta, colpa, denaro già speso o insistenza non obbligano nessuno a continuare."), bullet("Segnali semplici", "Usa parole dirette: 'fermati', 'questo no', 'me ne vado'. Se parlare è difficile, allontanati verso un luogo più sicuro."), bullet("Protezione", "Concorda prima le pratiche di protezione. Se una condizione cambia senza consenso, interrompi."), p("La violenza non è mai colpa di chi la subisce.","call"), PageBreak()]
story += [p("05  /  SALUTE", "eyebrow"), p("Dopo un rapporto a rischio", "h1"), bullet("Non aspettare i sintomi", "Contatta rapidamente pronto soccorso, servizio di malattie infettive o medico. Alcuni interventi sono sensibili al tempo."), bullet("PEP e valutazione medica", "La profilassi post-esposizione per HIV deve essere valutata da professionisti il prima possibile: non automedicarti."), bullet("Test", "Chiedi quali test fare e quando ripeterli: i tempi finestra cambiano secondo infezione e tipo di test."), bullet("Preservativi", "L'uso corretto del preservativo riduce il rischio di HIV e altre infezioni sessualmente trasmesse, ma non elimina ogni rischio."), card("In emergenza sanitaria", "Chiama il 112 o raggiungi il pronto soccorso. Porta con te, se disponibili, informazioni utili sull'esposizione senza mettere a rischio la tua sicurezza."), PageBreak()]
story += [p("06  /  SE QUALCOSA VA STORTO", "eyebrow"), p("Prima la sicurezza, poi le decisioni", "h1"), bullet("Vai in un luogo sicuro", "Contatta una persona fidata o il 112. Non affrontare da solo chi ti minaccia."), bullet("Cura", "Puoi chiedere assistenza sanitaria anche se non hai ancora deciso se denunciare."), bullet("Preserva ciò che può servire", "Conserva messaggi, fotografie dei danni e dati dell'incontro. Evita di modificare i file originali."), bullet("Scegli i tuoi tempi", "Un centro antiviolenza o un professionista può spiegarti opzioni e accompagnarti senza sostituirsi alle tue scelte."), card("1522", "Servizio pubblico gratuito contro violenza e stalking, attivo 24 ore su 24. È disponibile anche una chat sul sito 1522.eu."), PageBreak()]
story += [p("07  /  CONTATTI", "eyebrow"), p("Salva questa pagina", "h1"), card("112 · Emergenza", "Pericolo immediato, aggressione o emergenza sanitaria."), Spacer(1,9), card("1522 · Violenza e stalking", "Numero gratuito, attivo 24/7. Chat e mappa dei centri su www.1522.eu."), Spacer(1,9), card("Garante Privacy · Immagini intime", "Informazioni e segnalazioni su www.garanteprivacy.it/temi/revengeporn."), Spacer(1,9), card("Ministero della Salute · HIV e IST", "Informazioni ufficiali su www.salute.gov.it, sezione HIV/AIDS e infezioni sessualmente trasmesse."), Spacer(1,14), p("Se temi che qualcuno controlli il tuo telefono, usa un dispositivo sicuro e cancella solo ciò che puoi cancellare senza aumentare il rischio.","small"), PageBreak()]
story += [p("FONTI E TRASPARENZA", "eyebrow"), p("Informazioni verificabili", "h1"), p("Questa guida è un contenuto editoriale originale di Incontri di Bakeka. Non è affiliata all'associazione o alla guida fornita come riferimento e non ne riproduce testi o identità visiva."), p("Fonti istituzionali consultate:"), bullet("Ministero della Salute", "Fattori di esposizione al rischio HIV; FAQ HIV e AIDS; materiali su prevenzione e test."), bullet("Presidenza del Consiglio", "Sito ufficiale 1522, servizio pubblico antiviolenza e stalking."), bullet("Numero Unico Europeo", "Materiali istituzionali del NUE 112."), bullet("Garante Privacy", "Pagina informativa e procedura sul revenge porn."), p("Indirizzi verificati il 13 luglio 2026. I servizi e le indicazioni possono cambiare: controlla sempre le fonti ufficiali.","small"), PageBreak()]
story += [Spacer(1,100), Table([[p("PRIMA TU.<br/>SEMPRE.","center")]], colWidths=[326], rowHeights=[100], style=TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),('VALIGN',(0,0),(-1,-1),'MIDDLE')])), Spacer(1,20), p("Condividi questa guida con chi potrebbe averne bisogno.","h2"), p("Scaricabile gratuitamente dalla home di Incontri di Bakeka."), p("© 2026 Incontri di Bakeka · Riproduzione consentita solo in forma integrale e senza modifiche.","small")]

doc.build(story)
print(OUT)
