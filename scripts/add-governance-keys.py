#!/usr/bin/env python3
"""Add framework and independence keys to governance section in all locale files."""

import json
import os

# Translations for framework and independence sections
translations = {
    "en": {
        "governance.framework.title": "Governance Framework",
        "governance.framework.lead": "GTIXT operates through a layered governance structure that separates data collection, methodology design, integrity validation, and publication.",
        "governance.framework.indexCommittee.title": "Index Committee",
        "governance.framework.indexCommittee.text": "Responsible for approving methodology versions, reviewing structural changes, and validating index evolution. No authority to override scores.",
        "governance.framework.methodologyLayer.title": "Methodology Layer",
        "governance.framework.methodologyLayer.text": "Fully deterministic scoring engine defined by open specification (JSON). No manual overrides, no discretionary adjustments.",
        "governance.framework.integrityLayer.title": "Integrity Layer",
        "governance.framework.integrityLayer.text": "Agent C validates data quality, enforces NA-rate controls, detects anomalies, and applies integrity gate before publication.",
        "governance.framework.publicationLayer.title": "Publication Layer",
        "governance.framework.publicationLayer.text": "Snapshots published only after passing integrity validation. SHA-256 hashes ensure cryptographic verification.",
        "governance.framework.note": "Key principle: No single person or entity can unilaterally alter scores. Methodology changes require version increments, documentation, and backward compatibility.",
        "governance.independence.title": "Independence",
        "governance.independence.lead": "GTIXT operates independently from commercial, promotional, or financial relationships with evaluated firms.",
        "governance.independence.noCommercial.title": "No Commercial Relationships",
        "governance.independence.noCommercial.text": "GTIXT does not accept payments, sponsorships, advertising, or any form of compensation from prop trading firms. No paid placements, no promotional deals.",
        "governance.independence.noInfluence.title": "No Influence on Scores",
        "governance.independence.noInfluence.text": "Firms cannot pay to improve their scores, request manual adjustments, or influence methodology design. Scoring is deterministic and rule-based.",
        "governance.independence.structuralSeparation.title": "Structural Separation",
        "governance.independence.structuralSeparation.text": "Any future commercial activity (e.g., premium data access, institutional services) will be structurally separated from index methodology and publication.",
        "governance.independence.conflictOfInterest.title": "Conflict of Interest Policy",
        "governance.independence.conflictOfInterest.text": "Team members involved in methodology design or integrity validation cannot hold financial interests in evaluated firms.",
    },
    "fr": {
        "governance.framework.title": "Cadre de gouvernance",
        "governance.framework.lead": "GTIXT fonctionne selon une structure de gouvernance en couches qui sépare la collecte de données, la conception de méthodologie, la validation de l'intégrité et la publication.",
        "governance.framework.indexCommittee.title": "Comité d'index",
        "governance.framework.indexCommittee.text": "Responsable de l'approbation des versions de méthodologie, de l'examen des changements structurels et de la validation de l'évolution de l'index. Pas d'autorité pour contourner les scores.",
        "governance.framework.methodologyLayer.title": "Couche de méthodologie",
        "governance.framework.methodologyLayer.text": "Moteur de notation entièrement déterministe défini par une spécification ouverte (JSON). Pas de contournements manuels, pas d'ajustements discrétionnaires.",
        "governance.framework.integrityLayer.title": "Couche d'intégrité",
        "governance.framework.integrityLayer.text": "Agent C valide la qualité des données, applique les contrôles de taux NA, détecte les anomalies et applique la porte d'intégrité avant la publication.",
        "governance.framework.publicationLayer.title": "Couche de publication",
        "governance.framework.publicationLayer.text": "Les snapshots sont publiés uniquement après validation de l'intégrité. Les hashes SHA-256 garantissent une vérification cryptographique.",
        "governance.framework.note": "Principe clé : Aucune personne ou entité ne peut modifier unilatéralement les scores. Les changements de méthodologie nécessitent des incréments de version, de la documentation et la compatibilité rétroactive.",
        "governance.independence.title": "Indépendance",
        "governance.independence.lead": "GTIXT fonctionne indépendamment de toute relation commerciale, promotionnelle ou financière avec les entreprises évaluées.",
        "governance.independence.noCommercial.title": "Pas de relations commerciales",
        "governance.independence.noCommercial.text": "GTIXT n'accepte pas de paiements, partenariats, publicités ou toute forme de compensation des entreprises de trading propriétaire. Pas de placements payants, pas d'accords promotionnels.",
        "governance.independence.noInfluence.title": "Pas d'influence sur les scores",
        "governance.independence.noInfluence.text": "Les entreprises ne peuvent pas payer pour améliorer leurs scores, demander des ajustements manuels ou influencer la conception de la méthodologie. La notation est déterministe et basée sur des règles.",
        "governance.independence.structuralSeparation.title": "Séparation structurelle",
        "governance.independence.structuralSeparation.text": "Toute activité commerciale future (par exemple, accès aux données premium, services institutionnels) sera structurellement séparée de la méthodologie d'index et de la publication.",
        "governance.independence.conflictOfInterest.title": "Politique de conflit d'intérêts",
        "governance.independence.conflictOfInterest.text": "Les membres de l'équipe impliqués dans la conception de la méthodologie ou la validation de l'intégrité ne peuvent pas avoir d'intérêts financiers dans les entreprises évaluées.",
    },
    "es": {
        "governance.framework.title": "Marco de gobernanza",
        "governance.framework.lead": "GTIXT opera a través de una estructura de gobernanza por capas que separa la recopilación de datos, el diseño de metodología, la validación de integridad y la publicación.",
        "governance.framework.indexCommittee.title": "Comité de índices",
        "governance.framework.indexCommittee.text": "Responsable de aprobar versiones de metodología, revisar cambios estructurales y validar la evolución del índice. Sin autoridad para anular puntuaciones.",
        "governance.framework.methodologyLayer.title": "Capa de metodología",
        "governance.framework.methodologyLayer.text": "Motor de puntuación completamente determinista definido por especificación abierta (JSON). Sin anulaciones manuales, sin ajustes discrecionales.",
        "governance.framework.integrityLayer.title": "Capa de integridad",
        "governance.framework.integrityLayer.text": "El Agente C valida la calidad de los datos, aplica controles de tasa NA, detecta anomalías y aplica compuerta de integridad antes de la publicación.",
        "governance.framework.publicationLayer.title": "Capa de publicación",
        "governance.framework.publicationLayer.text": "Los snapshots se publican solo después de pasar la validación de integridad. Los hashes SHA-256 garantizan verificación criptográfica.",
        "governance.framework.note": "Principio clave: Ninguna persona o entidad puede alterar unilateralmente las puntuaciones. Los cambios de metodología requieren incrementos de versión, documentación y compatibilidad hacia atrás.",
        "governance.independence.title": "Independencia",
        "governance.independence.lead": "GTIXT opera de manera independiente de relaciones comerciales, promocionales o financieras con empresas evaluadas.",
        "governance.independence.noCommercial.title": "Sin relaciones comerciales",
        "governance.independence.noCommercial.text": "GTIXT no acepta pagos, patrocinios, publicidad o ninguna forma de compensación de empresas de trading propietario. Sin colocaciones pagadas, sin acuerdos promocionales.",
        "governance.independence.noInfluence.title": "Sin influencia en las puntuaciones",
        "governance.independence.noInfluence.text": "Las empresas no pueden pagar para mejorar sus puntuaciones, solicitar ajustes manuales o influir en el diseño de metodología. La puntuación es determinista y basada en reglas.",
        "governance.independence.structuralSeparation.title": "Separación estructural",
        "governance.independence.structuralSeparation.text": "Cualquier actividad comercial futura (por ejemplo, acceso a datos premium, servicios institucionales) estará estructuralmente separada de la metodología de índice y publicación.",
        "governance.independence.conflictOfInterest.title": "Política de conflicto de intereses",
        "governance.independence.conflictOfInterest.text": "Los miembros del equipo involucrados en el diseño de metodología o validación de integridad no pueden tener intereses financieros en empresas evaluadas.",
    },
    "de": {
        "governance.framework.title": "Governance-Rahmen",
        "governance.framework.lead": "GTIXT funktioniert durch eine mehrstufige Governance-Struktur, die Datenerfassung, Methodologiedesign, Integritätsvalidierung und Veröffentlichung trennt.",
        "governance.framework.indexCommittee.title": "Index-Ausschuss",
        "governance.framework.indexCommittee.text": "Verantwortlich für die Genehmigung von Methodologie-Versionen, Überprüfung struktureller Änderungen und Validierung der Index-Entwicklung. Keine Befugnis, Scores zu überschreiben.",
        "governance.framework.methodologyLayer.title": "Methodologie-Schicht",
        "governance.framework.methodologyLayer.text": "Vollständig deterministisches Bewertungsmodul, definiert durch offene Spezifikation (JSON). Keine manuellen Übersteuerungen, keine diskretionären Anpassungen.",
        "governance.framework.integrityLayer.title": "Integritäts-Schicht",
        "governance.framework.integrityLayer.text": "Agent C validiert Datenqualität, durchsetzt NA-Rate-Kontrollen, erkennt Anomalien und wendet Integritäts-Gate vor Veröffentlichung an.",
        "governance.framework.publicationLayer.title": "Publikations-Schicht",
        "governance.framework.publicationLayer.text": "Snapshots werden nur nach bestandener Integritätsvalidierung veröffentlicht. SHA-256-Hashes gewährleisten kryptographische Überprüfung.",
        "governance.framework.note": "Schlüsselprinzip: Keine einzelne Person oder Entität kann Scores einseitig ändern. Methodologieänderungen erfordern Versionssprünge, Dokumentation und Rückwärtskompatibilität.",
        "governance.independence.title": "Unabhängigkeit",
        "governance.independence.lead": "GTIXT operiert unabhängig von kommerziellen, promotionalen oder finanziellen Beziehungen zu bewerteten Unternehmen.",
        "governance.independence.noCommercial.title": "Keine geschäftlichen Beziehungen",
        "governance.independence.noCommercial.text": "GTIXT akzeptiert keine Zahlungen, Sponsorings, Werbung oder irgendeine Form von Kompensation von Proprietary-Trading-Unternehmen. Keine bezahlten Platzierungen, keine Werbedeals.",
        "governance.independence.noInfluence.title": "Kein Einfluss auf Scores",
        "governance.independence.noInfluence.text": "Unternehmen können nicht bezahlen, um ihre Scores zu verbessern, manuelle Anpassungen anfordern oder die Methodologiegestaltung beeinflussen. Die Bewertung ist deterministisch und regelbasiert.",
        "governance.independence.structuralSeparation.title": "Strukturelle Trennung",
        "governance.independence.structuralSeparation.text": "Jede zukünftige kommerzielle Aktivität (z. B. Premium-Datenzugriff, institutionelle Dienstleistungen) wird strukturell von Index-Methodologie und Veröffentlichung getrennt.",
        "governance.independence.conflictOfInterest.title": "Interessenkonflikt-Richtlinie",
        "governance.independence.conflictOfInterest.text": "Teammitglieder, die an Methodologiedesign oder Integritätsvalidierung beteiligt sind, dürfen keine finanziellen Interessen in bewerteten Unternehmen haben.",
    },
    "pt": {
        "governance.framework.title": "Estrutura de governança",
        "governance.framework.lead": "GTIXT opera através de uma estrutura de governança em camadas que separa coleta de dados, design de metodologia, validação de integridade e publicação.",
        "governance.framework.indexCommittee.title": "Comitê de índices",
        "governance.framework.indexCommittee.text": "Responsável por aprovar versões de metodologia, revisar mudanças estruturais e validar evolução do índice. Sem autoridade para anular pontuações.",
        "governance.framework.methodologyLayer.title": "Camada de metodologia",
        "governance.framework.methodologyLayer.text": "Motor de pontuação completamente determinístico definido por especificação aberta (JSON). Sem substituições manuais, sem ajustes discricionários.",
        "governance.framework.integrityLayer.title": "Camada de integridade",
        "governance.framework.integrityLayer.text": "Agente C valida qualidade de dados, impõe controles de taxa NA, detecta anomalias e aplica porta de integridade antes da publicação.",
        "governance.framework.publicationLayer.title": "Camada de publicação",
        "governance.framework.publicationLayer.text": "Snapshots são publicados apenas após passar na validação de integridade. Hashes SHA-256 garantem verificação criptográfica.",
        "governance.framework.note": "Princípio-chave: Nenhuma pessoa ou entidade pode alterar unilateralmente pontuações. Mudanças de metodologia requerem incrementos de versão, documentação e compatibilidade retroativa.",
        "governance.independence.title": "Independência",
        "governance.independence.lead": "GTIXT opera de forma independente de relacionamentos comerciais, promocionais ou financeiros com empresas avaliadas.",
        "governance.independence.noCommercial.title": "Sem relacionamentos comerciais",
        "governance.independence.noCommercial.text": "GTIXT não aceita pagamentos, patrocínios, publicidade ou nenhuma forma de compensação de empresas de trading proprietário. Sem posicionamentos pagos, sem acordos promocionais.",
        "governance.independence.noInfluence.title": "Sem influência nas pontuações",
        "governance.independence.noInfluence.text": "Empresas não podem pagar para melhorar suas pontuações, solicitar ajustes manuais ou influenciar design de metodologia. A pontuação é determinística e baseada em regras.",
        "governance.independence.structuralSeparation.title": "Separação estrutural",
        "governance.independence.structuralSeparation.text": "Qualquer atividade comercial futura (por exemplo, acesso a dados premium, serviços institucionais) será estruturalmente separada da metodologia de índice e publicação.",
        "governance.independence.conflictOfInterest.title": "Política de conflito de interesses",
        "governance.independence.conflictOfInterest.text": "Membros da equipe envolvidos em design de metodologia ou validação de integridade não podem ter interesses financeiros em empresas avaliadas.",
    },
    "it": {
        "governance.framework.title": "Quadro di governance",
        "governance.framework.lead": "GTIXT opera attraverso una struttura di governance a strati che separa la raccolta dati, la progettazione metodologica, la validazione dell'integrità e la pubblicazione.",
        "governance.framework.indexCommittee.title": "Comitato indice",
        "governance.framework.indexCommittee.text": "Responsabile dell'approvazione delle versioni di metodologia, della revisione dei cambiamenti strutturali e della convalida dell'evoluzione dell'indice. Nessuna autorità di sovrascrivere i punteggi.",
        "governance.framework.methodologyLayer.title": "Livello metodologico",
        "governance.framework.methodologyLayer.text": "Motore di punteggio completamente deterministico definito da specifica aperta (JSON). Nessun override manuale, nessun adeguamento discrezionale.",
        "governance.framework.integrityLayer.title": "Livello di integrità",
        "governance.framework.integrityLayer.text": "L'Agente C convalida la qualità dei dati, applica controlli del tasso NA, rileva anomalie e applica il gate di integrità prima della pubblicazione.",
        "governance.framework.publicationLayer.title": "Livello di pubblicazione",
        "governance.framework.publicationLayer.text": "Gli snapshot vengono pubblicati solo dopo aver superato la convalida dell'integrità. Gli hash SHA-256 garantiscono la verifica crittografica.",
        "governance.framework.note": "Principio chiave: Nessuna singola persona o entità può alterare unilateralmente i punteggi. I cambiamenti metodologici richiedono incrementi di versione, documentazione e compatibilità retroattiva.",
        "governance.independence.title": "Indipendenza",
        "governance.independence.lead": "GTIXT opera indipendentemente da relazioni commerciali, promozionali o finanziarie con le aziende valutate.",
        "governance.independence.noCommercial.title": "Nessuna relazione commerciale",
        "governance.independence.noCommercial.text": "GTIXT non accetta pagamenti, sponsorizzazioni, pubblicità o nessuna forma di compensazione da società di trading proprietario. Nessun posizionamento a pagamento, nessun accordo promozionale.",
        "governance.independence.noInfluence.title": "Nessuna influenza sui punteggi",
        "governance.independence.noInfluence.text": "Le aziende non possono pagare per migliorare i loro punteggi, richiedere aggiustamenti manuali o influenzare la progettazione metodologica. Il punteggio è deterministico e basato su regole.",
        "governance.independence.structuralSeparation.title": "Separazione strutturale",
        "governance.independence.structuralSeparation.text": "Qualsiasi attività commerciale futura (ad esempio, accesso ai dati premium, servizi istituzionali) sarà strutturalmente separata dalla metodologia dell'indice e dalla pubblicazione.",
        "governance.independence.conflictOfInterest.title": "Politica di conflitto di interessi",
        "governance.independence.conflictOfInterest.text": "I membri del team coinvolti nella progettazione metodologica o nella convalida dell'integrità non possono avere interessi finanziari nelle aziende valutate.",
    }
}

locales_dir = "/opt/gpti/gpti-site/public/locales"
languages = ["en", "fr", "es", "de", "pt", "it"]

for lang in languages:
    file_path = os.path.join(locales_dir, lang, "common.json")
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Ensure governance section exists and merge new keys
    if "governance" not in data:
        data["governance"] = {}
    
    # Add the new keys from translations
    lang_translations = translations[lang]
    for key, value in lang_translations.items():
        # Parse nested keys (e.g., "governance.framework.title")
        parts = key.split(".")
        current = data
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    
    # Write back
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Updated {lang}/common.json")

print("\n✅ All locale files updated with framework and independence keys!")
