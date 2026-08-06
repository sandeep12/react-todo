import { SessionsView, type SessionsViewProps } from '../sessions/SessionsView'

export type SessionsPageProps = SessionsViewProps

export default function SessionsPage(props: SessionsPageProps) {
  return <SessionsView {...props} />
}
