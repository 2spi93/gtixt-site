import Link from 'next/link'
import { Twitter, Linkedin, Github, Mail } from 'lucide-react'

const footerSections = [
  {
    title: 'Platform',
    links: [
      { name: 'Index', href: '/index' },
      { name: 'Rankings', href: '/rankings' },
      { name: 'Firms', href: '/firms' },
      { name: 'Industry Galaxy', href: '/industry-map' },
      { name: 'Analytics', href: '/analytics' },
      { name: 'Data', href: '/data' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Research', href: '/research' },
      { name: 'API Documentation', href: '/api-docs' },
      { name: 'Methodology', href: '/methodology' },
      { name: 'Verify Snapshot', href: '/verify' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  },
]

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/gtixt', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/gtixt', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/gtixt', label: 'GitHub' },
  { icon: Mail, href: 'mailto:contact@gtixt.com', label: 'Email' },
]

export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-turquoise flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-white font-bold text-2xl">GTIXT</span>
            </div>
            <p className="text-dark-300 text-sm mb-6 max-w-md">
              Institutional-grade intelligence platform for prop firm transparency, 
              payout reliability, and risk integrity.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-dark-300 hover:text-primary-400 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-dark-400 text-sm">
            © {new Date().getFullYear()} GTIXT. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-dark-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>Live data • Updated every 2 minutes</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
