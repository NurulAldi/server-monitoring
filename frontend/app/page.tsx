import { Navigation } from '@/komponen/umum/Navigation'
import { HeroSection } from '@/komponen/umum/HeroSection'
import { Card, CardHeader, CardTitle, CardBody } from '@/komponen/umum/Card'
import { Tombol } from '@/komponen/umum/Tombol'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pure-black">
      <Navigation />

      {/* Hero Section */}
      <HeroSection
        subtitle="Real-Time Monitoring"
        title="Server Health, Simplified"
        description="Monitor your infrastructure with Tesla-inspired minimalism. Clean, powerful, and built for performance."
      >
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/dashboard">
            <Tombol variant="primary" size="lg">
              View Dashboard
            </Tombol>
          </Link>
          <Link href="/autentikasi">
            <Tombol variant="outline" size="lg">
              Sign In
            </Tombol>
          </Link>
        </div>
      </HeroSection>

      {/* Features Section */}
      <section className="py-24 px-8 bg-deep-grey">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-display-md text-high-contrast">
              Built for Clarity
            </h2>
            <p className="text-body-lg text-neutral-400 max-w-2xl mx-auto">
              Every element designed to give you instant insights without the noise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card hover>
              <CardHeader>
                <CardTitle>Real-Time Metrics</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-body text-neutral-400">
                  Live CPU, memory, and disk monitoring with WebSocket updates.
                </p>
              </CardBody>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Smart Alerts</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-body text-neutral-400">
                  Intelligent notifications when your servers need attention.
                </p>
              </CardBody>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Clean Interface</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-body text-neutral-400">
                  Tesla-inspired design that puts data first, distractions last.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-display-md text-high-contrast">
            Experience Premium Monitoring
          </h2>
          <p className="text-body-lg text-neutral-400">
            Join teams who trust simplicity and performance.
          </p>
          <Link href="/autentikasi/registrasi">
            <Tombol variant="primary" size="lg">
              Get Started Free
            </Tombol>
          </Link>
        </div>
      </section>
    </div>
  )
}