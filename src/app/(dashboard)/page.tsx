import { DashboardPage } from '@/components/pages/dashboard-page'
import { getDashboardBootstrapData } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialData = await getDashboardBootstrapData()

  return <DashboardPage initialData={initialData} />
}
