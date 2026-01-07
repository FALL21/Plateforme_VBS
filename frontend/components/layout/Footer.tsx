import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto bg-background/90 backdrop-blur border-t border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/signe.png" alt="VBS" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              <span className="text-xl sm:text-2xl font-bold text-primary">VBS</span>
            </Link>
            <p className="text-gray-600 text-sm">
              Plateforme de services
            </p>
          </div>

          {/* Informations de contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Appel</p>
                  <a
                    href="tel:+221776806767"
                    className="text-gray-700 hover:text-primary transition-colors font-medium"
                  >
                    +221 776806767
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">E-mail</p>
                  <a
                    href="mailto:infos@vbs.sevices"
                    className="text-gray-700 hover:text-primary transition-colors font-medium"
                  >
                    infos@vbs.sevices
                  </a>
                </div>
              </div>
              {/* Bouton WhatsApp direct */}
              <div className="pt-1">
                <a
                  href="https://wa.me/221776806767?text=Bonjour%2C%20je%20vous%20contacte%20via%20la%20plateforme%20VBS."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium shadow-sm transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    aria-hidden
                  >
                    <path d="M.057 24l1.687-6.163A11.867 11.867 0 010 11.99C0 5.373 5.373 0 11.987 0 18.614 0 24 5.373 24 11.99 24 18.627 18.614 24 11.987 24a11.9 11.9 0 01-6.093-1.656L.057 24zm6.597-3.807a9.89 9.89 0 005.333 1.555h.004c5.45 0 9.886-4.429 9.889-9.87.003-5.452-4.421-9.89-9.872-9.893-5.452 0-9.887 4.43-9.89 9.882a9.84 9.84 0 001.822 5.74l-.999 3.648 3.713-.962zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.03-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.476-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.205-.242-.58-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.017-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.1 3.2 5.081 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.006-1.412.248-.694.248-1.289.173-1.412z" />
                  </svg>
                  <span>Écrire sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Service disponible */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service client</h3>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-700 font-medium">Service disponible 24/7</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} VBS - Vos Besoins Services. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

