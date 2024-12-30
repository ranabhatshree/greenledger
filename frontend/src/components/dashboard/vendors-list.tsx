import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface VendorsListProps {
  vendors: any[]; // Replace with your vendor type
  isLoading: boolean;
  error: string | null;
}

export function VendorsList({ vendors, isLoading, error }: VendorsListProps) {
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">Failed to load vendors data</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Top Vendors by Sales</h2>
      <div className="mt-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
              <Skeleton className="h-4 w-[100px]" />
            </div>
          ))
        ) : (
          vendors.map((vendor, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div>
                <p className="font-medium text-l">{vendor.name}</p>
                <p className={`text-sm ${vendor.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {vendor.growth}
                </p>
              </div>
              <p className="font-medium text-sm">{vendor.amount}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}