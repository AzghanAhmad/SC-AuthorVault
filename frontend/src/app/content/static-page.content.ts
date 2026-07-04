export interface StaticPageSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}

export interface StaticPageContent {
  title: string;
  subtitle?: string;
  sections: StaticPageSection[];
}

export const STATIC_PAGES: Record<string, StaticPageContent> = {
  about: {
    title: 'About ScribeCount',
    subtitle: 'Built for authors who treat publishing like a business.',
    sections: [
      {
        paragraphs: [
          'ScribeCount powers AuthorVault — a centralized platform for independent authors and small publishing companies to manage books, assets, metadata, and business records in one secure place.',
          'We built AuthorVault because serious authors need more than folders and spreadsheets. You need a single source of truth for company details, imprints, pen names, series, formats, ISBNs, important dates, and every file tied to your catalog.'
        ]
      },
      {
        heading: 'What AuthorVault helps you do',
        list: [
          'Organize your publishing business hierarchy — company, imprints, pen names, series, and books',
          'Store and manage book assets, platform versions, and marketing materials',
          'Track legal, financial, and operational company information in one vault',
          'Keep important publishing deadlines and business dates visible',
          'Work from a responsive dashboard designed for day-to-day author operations'
        ]
      },
      {
        paragraphs: [
          'ScribeCount is committed to giving authors professional-grade tools without unnecessary complexity — so you can spend less time searching for files and more time writing and publishing.'
        ]
      }
    ]
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'We’re here to help with AuthorVault.',
    sections: [
      {
        paragraphs: [
          'Have a question about your account, need help getting started, or want to share feedback? Reach out using the details below and we’ll get back to you as soon as possible.'
        ]
      },
      {
        heading: 'General inquiries',
        paragraphs: [
          'Email: support@scribecount.com',
          'Business hours: Monday – Friday, 9:00 AM – 5:00 PM (ET)'
        ]
      },
      {
        heading: 'Technical support',
        paragraphs: [
          'For login issues, data questions, or platform bugs, email support@scribecount.com with a brief description of the issue and any screenshots that may help.',
          'Please include the email address associated with your AuthorVault account so we can assist you faster.'
        ]
      },
      {
        heading: 'Partnerships & press',
        paragraphs: [
          'For partnership or media inquiries, contact partnerships@scribecount.com.'
        ]
      }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Last updated: July 4, 2026',
    sections: [
      {
        paragraphs: [
          'ScribeCount (“we,” “us,” or “our”) operates AuthorVault. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.'
        ]
      },
      {
        heading: 'Information we collect',
        list: [
          'Account information such as your name, email address, and password',
          'Content you upload or enter into AuthorVault, including company data, book metadata, and files',
          'Usage data such as pages visited, features used, and device/browser information',
          'Communications you send to us for support or feedback'
        ]
      },
      {
        heading: 'How we use your information',
        list: [
          'To provide, maintain, and improve AuthorVault',
          'To authenticate users and secure accounts',
          'To respond to support requests and communicate service updates',
          'To monitor usage, prevent fraud, and enforce our Terms of Service'
        ]
      },
      {
        heading: 'How we share information',
        paragraphs: [
          'We do not sell your personal information. We may share data with trusted service providers who help us host, secure, or operate the platform, and only to the extent necessary to perform those services. We may also disclose information if required by law or to protect our rights and users.'
        ]
      },
      {
        heading: 'Data security & retention',
        paragraphs: [
          'We use reasonable administrative, technical, and organizational measures to protect your data. You are responsible for maintaining the confidentiality of your login credentials. We retain your information while your account is active and as needed to comply with legal obligations.'
        ]
      },
      {
        heading: 'Your choices',
        paragraphs: [
          'You may update profile information in your account settings. To request access, correction, or deletion of your data, contact support@scribecount.com.'
        ]
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about this Privacy Policy may be sent to support@scribecount.com.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Last updated: July 4, 2026',
    sections: [
      {
        paragraphs: [
          'These Terms of Service (“Terms”) govern your access to and use of AuthorVault, provided by ScribeCount. By creating an account or using the service, you agree to these Terms.'
        ]
      },
      {
        heading: 'Eligibility & accounts',
        list: [
          'You must provide accurate registration information and keep your credentials secure',
          'You are responsible for all activity under your account',
          'You must be at least 18 years old or have permission from a parent or guardian to use the service'
        ]
      },
      {
        heading: 'Your content',
        paragraphs: [
          'You retain ownership of content you upload to AuthorVault. You grant ScribeCount a limited license to host, store, and process your content solely to provide and improve the service. You represent that you have the rights necessary to upload and manage your content.'
        ]
      },
      {
        heading: 'Acceptable use',
        list: [
          'Do not use AuthorVault for unlawful, harmful, or abusive purposes',
          'Do not attempt to access other users’ accounts or data',
          'Do not interfere with the security or operation of the platform',
          'Do not upload malware or content that infringes third-party rights'
        ]
      },
      {
        heading: 'Service availability',
        paragraphs: [
          'We strive to keep AuthorVault available and reliable, but the service is provided on an “as is” and “as available” basis. We may modify, suspend, or discontinue features with reasonable notice where possible.'
        ]
      },
      {
        heading: 'Limitation of liability',
        paragraphs: [
          'To the fullest extent permitted by law, ScribeCount is not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of AuthorVault. Our total liability for any claim related to the service is limited to the amount you paid us in the twelve months before the claim, or one hundred U.S. dollars if no fees were paid.'
        ]
      },
      {
        heading: 'Termination',
        paragraphs: [
          'You may stop using AuthorVault at any time. We may suspend or terminate access if you violate these Terms or if necessary to protect the service or other users.'
        ]
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about these Terms may be sent to support@scribecount.com.'
        ]
      }
    ]
  }
};
