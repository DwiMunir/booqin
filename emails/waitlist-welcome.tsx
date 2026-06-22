import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

// Template email konfirmasi (React Email → render benar di Gmail/Outlook/Apple Mail).
export function WaitlistWelcome() {
  return (
    <Html lang="en">
      <Head />
      <Preview>You're on the Booqin early-access waitlist</Preview>
      <Body
        style={{
          backgroundColor: '#FAF7F1',
          margin: 0,
          padding: '32px 0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 32,
          }}
        >
          <Heading
            as="h1"
            style={{ color: '#0E4D47', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}
          >
            You're on the list 🎉
          </Heading>
          <Text style={{ color: '#4C5A56', fontSize: 16, lineHeight: '1.5', margin: '0 0 20px' }}>
            Thanks for joining the Booqin early-access waitlist. We'll email you the moment your
            spot opens — and early members get founder pricing.
          </Text>
          <Button
            href="https://booqin.moonir.dev"
            style={{
              backgroundColor: '#E0942E',
              color: '#1c1206',
              fontSize: 15,
              fontWeight: 700,
              padding: '12px 22px',
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            Learn more about Booqin
          </Button>
          <Text style={{ color: '#7A857F', fontSize: 12, lineHeight: '1.5', margin: '24px 0 0' }}>
            You received this because you joined the waitlist at booqin.moonir.dev. Not you? You can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
