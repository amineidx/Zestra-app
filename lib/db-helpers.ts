import { prisma } from './prisma'

export async function getOrCreateSettings() {
  try {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          businessName: 'Ghaith Nedder', // Set placeholder
          email: 'ghaith@autoentrepreneur.dz',
          phone: '+213 555 12 34 56',
          address: 'Algiers, Algeria',
          nif: '199016180029314', // Default valid Algerian NIF structure
          autoEntrepreneurNumber: '26/00123/AE',
          logoUrl: '',
          signatureUrl: '',
          geminiApiKey: process.env.GEMINI_API_KEY || '',
        },
      })
    }
    return settings;
  } catch (error) {
    console.error('Error fetching/creating settings:', error)
    return null
  }
}

export async function getOrCreateDefaultKnowledge() {
  try {
    const count = await prisma.knowledgeArticle.count()
    if (count === 0) {
      await prisma.knowledgeArticle.createMany({
        data: [
          {
            title: 'Algerian Auto Entrepreneur Tax Guidelines (2026)',
            content: `The Auto Entrepreneur status in Algeria (Statut de l'Auto-Entrepreneur) was introduced under Law 22-23.
Key tax information:
1. Income Tax (IFU - Impôt Forfaitaire Unique): The standard tax rate is 0.5% of annual turnover/revenue (reduced from 5% under recent Finance Acts).
2. Declarations: Declarations are submitted quarterly or annually depending on current regulations. The primary tax form used is the G50 or the special Auto Entrepreneur declaration portal.
3. Ceiling: The annual revenue must not exceed 5,000,000 DZD. Exceeding this ceiling for three consecutive years results in transitioning to the standard commercial register status.`,
            tags: 'tax, IFU, law, limits',
          },
          {
            title: 'CASNOS Social Security Contributions',
            content: `All Auto Entrepreneurs in Algeria are legally required to register with CASNOS (Caisse Nationale de Sécurité Sociale des Non-Salariés) within 10 days of starting their activity.
Key details:
1. Contribution Rate: The standard contribution is 15% of the declared income, subject to a minimum and maximum cap.
2. Minimum Contribution: The minimum contribution is calculated based on the National Minimum Guaranteed Wage (SNMG), which is 20,000 DZD per month. The annual minimum CASNOS contribution is roughly 32,000 DZD.
3. Deadline: Contributions are typically payable before July 31st of each calendar year. Late payments incur a 5% penalty plus 1% per month of delay.`,
            tags: 'casnos, social security, pension, health',
          },
          {
            title: 'Auto-Entrepreneur Card & NIF Requirements',
            content: `To practice as an Auto-Entrepreneur in Algeria, you must obtain your Auto-Entrepreneur card from the ANAE (Agence Nationale de l'Auto-Entrepreneur) at anaec.dz.
Once registered:
1. You will be assigned a NIF (Numéro d'Identification Fiscale) by the tax authorities.
2. You will get a unique Auto-Entrepreneur number (e.g. 26/00123/AE).
3. These numbers must be printed on all your invoices, quotes, and legal documents.`,
            tags: 'nif, card, anae, setup',
          },
        ],
      })
    }
  } catch (error) {
    console.error('Error seeding knowledge base:', error)
  }
}
