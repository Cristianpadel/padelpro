import { redirect } from 'next/navigation';

export default function MatchesPage() {
  // Temporary disabled page: redirect to activities 'partidas'
  return redirect('/activities?view=partidas');
}
