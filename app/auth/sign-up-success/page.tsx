import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl font-bold text-center">
            Thank you for signing up!
          </h3>
          <Card className="bg-muted max-w-lg w-full mx-auto">
            <CardContent className="p-8">
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
