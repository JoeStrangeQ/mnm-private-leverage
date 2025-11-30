import { PoolDataHeader } from "~/components/PoolDataHeader";
import { Address, toAddress } from "../../../convex/utils/solana";
import { useParams } from "@tanstack/react-router";
import { CreatePositionPanel } from "~/components/trade/CreatePositionPanel";
import { RangeSelectorPanel } from "~/components/trade/RangeSelectorPanel";
import { MnMSuspense } from "~/components/MnMSuspense";
import { ChartColumnIncreasing } from "lucide-react";
import { usePool } from "~/states/pools";

export default function DlmmTradePage() {
  const { poolAddress } = useParams({ strict: false }) as {
    poolAddress: string;
  };

  const parsedPoolAddress = toAddress(poolAddress);
  return (
    <div className="w-full px-8 py-16">
      <PoolDataHeader protocol="dlmm" poolAddress={toAddress(poolAddress)} />

      <div
        className="w-full grid gap-2
  xl:grid-cols-[1fr_0.6fr]
  lg:grid-cols-[1fr_0.75fr]
  md:grid-cols-1"
      >
        {/* LEFT SIDE (60%) */}
        <div className="flex flex-col gap-2 lg:grid lg:grid-rows-[7fr_3fr]">
          <div className="rounded-2xl bg-backgroundSecondary ">
            <MnMSuspense
              fallback={
                <div className="w-full flex flex-1 rounded-2xl inner-white items-center justify-center">
                  <ChartColumnIncreasing className="w-10 h-10 animate-pulse text-text" />
                </div>
              }
            >
              <TradingViewChartTemp poolAddress={parsedPoolAddress} />
            </MnMSuspense>
          </div>

          <div className="rounded-2xl bg-backgroundSecondary px-4 py-3.5  overflow-hidden">
            <RangeSelectorPanel poolAddress={parsedPoolAddress} />
          </div>
        </div>

        {/* Create Position panel*/}
        <div className="rounded-2xl bg-backgroundSecondary px-4 py-6">
          <CreatePositionPanel poolAddress={parsedPoolAddress} />
        </div>
      </div>

      {/* 
      <div className="flex flex-row gap-2">
        <div className="flex flex-col bg-backgroundSecondary rounded-2xl w-[40%] px-5 py-5">
          <CollateralDepositInput />
        </div>
        <div className="flex flex-1 flex-col bg-red rounded-2xl w-[60%] h-full">s</div>
      </div> */}
    </div>
  );
}

function TradingViewChartTemp({ poolAddress }: { poolAddress: Address }) {
  const pool = usePool({ poolAddress, protocol: "dlmm" });

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return (
    <iframe
      className="w-full h-full flex flex-1 rounded-2xl"
      src={`https://birdeye.so/tv-widget/${pool.mint_x}/${pool.mint_y}?chain=solana&viewMode=base%2Fquote&chartInterval=15&chartType=Candle&chartTimezone=Asia%2FJerusalem&chartLeftToolbar=show&theme=dark&cssCustomProperties=--tv-color-platform-background%3A%230c0c12&cssCustomProperties=--tv-color-pane-background%3A%2311131a&chartOverrides=mainSeriesProperties.candleStyle.upColor%3A%2329cc88&chartOverrides=mainSeriesProperties.candleStyle.borderUpColor%3A%2329cc88&chartOverrides=mainSeriesProperties.candleStyle.wickUpColor%3A%2329cc88&chartOverrides=mainSeriesProperties.candleStyle.downColor%3A%23fd4a4a&chartOverrides=mainSeriesProperties.candleStyle.borderDownColor%3A%23fd4a4a&chartOverrides=mainSeriesProperties.candleStyle.wickDownColor%3A%23fd4a4a&chartOverrides=paneProperties.backgroundType%3Asolid&chartOverrides=paneProperties.background%3Argba%2812%2C+12%2C+18%2C+1%29`}
      allowFullScreen={true}
    />
  );
}
