import { DashboardPage } from '@/components/pages/dashboard-page'
import { getDashboardBootstrapData } from '@/lib/dashboard-data'

export default async function Page() {
  const initialData = await getDashboardBootstrapData()

  return <DashboardPage initialData={initialData} />
}
