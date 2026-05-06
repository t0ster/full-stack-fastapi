import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"

const Forbidden = () => {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4 text-center"
      data-testid="forbidden"
    >
      <span className="mb-4 text-6xl font-bold leading-none md:text-8xl">
        403
      </span>
      <h1 className="mb-2 text-2xl font-bold">Access Denied</h1>
      <p className="mb-4 max-w-md text-lg text-muted-foreground">
        You do not have permission to access this page.
      </p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}

export default Forbidden
