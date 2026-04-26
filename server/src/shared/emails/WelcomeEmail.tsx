// src/emails/WelcomeEmailMinimal.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Preview,
  Tailwind,
  Button,
} from "react-email";

interface WelcomeEmailProps {
  name: string;
  role: "BUYER" | "SUPPLIER";
  dashboardUrl?: string;
}

const WelcomeEmailMinimal = ({
  name,
  role,
  dashboardUrl = "https://bidsync.com/dashboard",
}: WelcomeEmailProps) => {
  const isBuyer = role === "BUYER";

  return (
    <Html lang="en">
      <Tailwind>
        {" "}
        <Head />
        <Preview>Welcome to BidSync - Let's get started</Preview>
        <Body className="bg-gray-50 font-sans my-auto mx-auto py-12 px-4">
          <Container className="max-w-[480px] mx-auto">
            {/* Logo */}
            <Section className="text-center mb-6">
              <Text className="text-2xl font-bold text-gray-900 m-0">
                Bid<span className="text-blue-600">Sync</span>
              </Text>
            </Section>

            {/* Card */}
            <Section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Section className="px-8 pt-8 pb-6">
                {/* Icon */}
                <div className="text-center mb-4">
                  <span className="text-5xl">👋</span>
                </div>

                <Heading className="text-2xl font-semibold text-gray-900 text-center m-0 mb-2">
                  Welcome, {name}!
                </Heading>

                <Text className="text-gray-600 text-center text-sm mb-6">
                  Your {role} account is ready
                </Text>

                <Text className="text-gray-600 text-sm leading-relaxed mb-4">
                  We're excited to have you on board. BidSync helps you{" "}
                  {isBuyer
                    ? "source products and services efficiently"
                    : "find opportunities and grow your business"}
                  .
                </Text>

                <Button
                  href={dashboardUrl}
                  className="bg-blue-600 text-white py-2.5 px-5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors no-underline inline-block w-full text-center"
                >
                  Access Your Dashboard
                </Button>

                <Hr className="border-gray-100 my-6" />

                <Text className="text-gray-400 text-xs text-center">
                  Questions? Contact{" "}
                  <a
                    href="mailto:support@bidsync.com"
                    className="text-blue-600 no-underline"
                  >
                    support@bidsync.com
                  </a>
                </Text>
              </Section>
            </Section>

            <Text className="text-gray-400 text-[10px] text-center mt-6">
              © {new Date().getFullYear()} BidSync. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmailMinimal;
