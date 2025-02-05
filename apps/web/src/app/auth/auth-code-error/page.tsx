import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 text-center">
      <h1 className="text-4xl font-bold text-red-600">Authentication Error</h1>
      <p className="mt-4 text-lg">
        There was an error signing you in. The verification code might be invalid or expired.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
      >
        Return to Login
      </Link>
    </div>
  )
}
