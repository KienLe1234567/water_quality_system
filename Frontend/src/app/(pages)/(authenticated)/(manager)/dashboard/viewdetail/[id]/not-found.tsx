import { Button } from '@/components/ui/button';
import Link from "next/link";

export default function NotFound() {
  return (
    <div className='flex items-center flex-center flex-col gap-10 mt-10'>
      <h2 className='text-5xl text-red-500 font-bold'>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/dashboard/homepage"><Button>Back to Home</Button></Link>
    </div>
  );
}
