import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiDemo } from '@/components/api-demo'
import { ArrowRight, Code, Palette, Zap, Shield, Globe, Smartphone } from 'lucide-react'
import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect root '/' to the dashboard
  redirect('/dashboard')

  const features = [
    {
      icon: <Code className="h-6 w-6" />,
      title: 'TypeScript Ready',
      description: 'Built with TypeScript for better development experience and type safety.',
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Modern Design',
      description: 'Beautiful UI components built with Tailwind CSS and modern design principles.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Performance Optimized',
      description: 'Optimized for speed with Next.js 14 App Router and modern web standards.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Production Ready',
      description: 'Configured with ESLint, Prettier, and best practices for production deployment.',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'SEO Optimized',
      description: 'Built-in SEO optimization with proper meta tags and structured data.',
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: 'Responsive Design',
      description: 'Fully responsive design that works perfectly on all devices.',
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <div className="h-6 w-6 rounded-md bg-primary" />
              <span className="font-bold">ProjectX</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6">
              <a
                className="text-sm font-medium transition-colors hover:text-primary"
                href="#features"
              >
                Features
              </a>
              <a
                className="text-sm font-medium transition-colors hover:text-primary"
                href="#about"
              >
                About
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center space-y-4 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          Production Ready
        </Badge>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Modern Next.js
          <br />
          <span className="text-primary">Web Application</span>
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          A production-ready Next.js application built with TypeScript, Tailwind CSS, and modern
          development practices. Ready to scale and deploy.
        </p>
        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Button size="lg" className="gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            View Documentation
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">Features</h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Everything you need to build a modern web application.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 mt-16">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container py-24">
        <div className="mx-auto max-w-[58rem] text-center">
          <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl mb-8">
            About This Project
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Built for Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This application is architected with scalability in mind, using modern patterns
                  and best practices that allow it to grow with your needs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Developer Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configured with the best development tools including TypeScript, ESLint, Prettier,
                  and hot reloading for an optimal developer experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <div className="h-6 w-6 rounded-md bg-primary" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with Next.js, TypeScript, and Tailwind CSS.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © 2024 ProjectX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
