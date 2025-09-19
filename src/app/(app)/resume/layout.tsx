interface ResumeLayoutProps {
  children: React.ReactNode
}

export default function ResumeLayout({ children }: ResumeLayoutProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  )
}