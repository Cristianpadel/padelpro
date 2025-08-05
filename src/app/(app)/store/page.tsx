import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const storeItems = [
    { name: "PadelPro Racket X1", price: "€150.00", image: "https://placehold.co/600x400.png", hint: "padel racket" },
    { name: "PadelPro Balls (3-pack)", price: "€5.00", image: "https://placehold.co/600x400.png", hint: "padel balls" },
    { name: "Club T-Shirt", price: "€25.00", image: "https://placehold.co/600x400.png", hint: "sports shirt" },
    { name: "Pro Grip Overgrips", price: "€8.00", image: "https://placehold.co/600x400.png", hint: "racket grip" },
]

export default function StorePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <header>
        <h1 className="font-headline text-3xl font-semibold">Club Store</h1>
        <p className="text-muted-foreground">
          Reserve club merchandise and gear with a small deposit.
        </p>
      </header>
      <main className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {storeItems.map((item, index) => (
            <Card key={index} className="overflow-hidden shadow-lg transition-transform hover:scale-105">
                <CardHeader className="p-0">
                    <Image
                        src={item.image}
                        alt={item.name}
                        width={600}
                        height={400}
                        className="h-48 w-full object-cover"
                        data-ai-hint={item.hint}
                    />
                </CardHeader>
                <CardContent className="p-4">
                    <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <Badge variant="secondary" className="text-lg font-bold">{item.price}</Badge>
                    <Button>Reserve</Button>
                </CardFooter>
            </Card>
        ))}
      </main>
    </div>
  );
}
