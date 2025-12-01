import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useConvexUser } from "~/providers/UserStates";
import { DlmmOpenPositionRow } from "./DlmmOpenPosition";
import { cn } from "~/utils/cn";
import { TableRow, TableHead, TableHeader, TableBody, TableCell, Table } from "../ui/Table";
import { SlidingSelect } from "../ui/SlidingSelector";
import { useState } from "react";

export function OpenPositionsTable() {
  const { convexUser } = useConvexUser();
  const [sizeState, setSizeState] = useState<"Current" | "Initial">("Current");
  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-backgroundSecondary p-4 custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-textSecondary/60">Pool</TableHead>
            <TableHead className="text-textSecondary/60">Collateral</TableHead>
            <TableHead className="flex flex-row items-center gap-1.5 text-textSecondary/60 ">
              Size
              <SlidingSelect
                options={[
                  {
                    id: "Current",
                    element: (
                      <div
                        className={cn(
                          "text-[10px]",
                          sizeState === "Current" ? "text-textSecondary" : "text-textSecondary/30"
                        )}
                      >
                        Current
                      </div>
                    ),
                  },
                  {
                    id: "Initial",
                    element: (
                      <div
                        className={cn(
                          "text-[10px]",
                          sizeState === "Initial" ? "text-textSecondary" : "text-textSecondary/30"
                        )}
                      >
                        Initial
                      </div>
                    ),
                  },
                ]}
                value={sizeState}
                disableScale
                className="bg-backgroundTertiary"
                highlightClassName="bg-white/5 backdrop-blur-md"
                onChange={(state) => {
                  setSizeState(state);
                }}
              />
            </TableHead>
            <TableHead className="text-textSecondary/60">Range</TableHead>
            <TableHead className="text-textSecondary/60">Price/Entry</TableHead>
            {/* <TableHead className="text-textSecondary/60">Liquidation</TableHead>
            <TableHead className="text-textSecondary/60">SL/TP</TableHead> */}
            <TableHead className="text-textSecondary/60">Claimable Fees</TableHead>
            <TableHead className="text-textSecondary/60">PnL</TableHead>
          </TableRow>
        </TableHeader>

        {convexUser && <OpenPositions convexUser={convexUser} />}
      </Table>
    </div>
  );
}

function OpenPositions({ convexUser }: { convexUser: Doc<"users"> }) {
  const openDbPositions = useQuery(api.tables.positions.get.getUserOpenPositions, { userId: convexUser._id });

  if (!openDbPositions) {
    return (
      <TableBody>
        <TableRow>
          <TableCell>Loading...</TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (openDbPositions.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell>No open positions</TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {openDbPositions.map((dbPosition) => (
        <DlmmOpenPositionRow key={dbPosition._id} dbPosition={dbPosition} />
      ))}
    </TableBody>
  );
}

// function TableHeader() {
//   return (
//     <div className={cn("w-full px-4 py-2 text-xs text-textSecondary text-left ", POSITION_GRID)}>
//       <div>Pool</div>
//       <div>Collateral</div>
//       <div>
//         Size
//         <div className="flex gap-2 text-[10px] text-textSecondary">
//           <span>Current</span> <span className="opacity-40">Initial</span>
//         </div>
//       </div>
//       <div>Range</div>
//       <div>Price/Entry</div>
//       <div>Liquidation</div>
//       <div>SL/TP</div>
//       <div>Claimable Fees</div>
//       <div>PnL</div>
//     </div>
//   );
// }
