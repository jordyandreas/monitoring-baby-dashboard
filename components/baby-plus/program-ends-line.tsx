import { format } from "date-fns";
import { getProgramEnd } from "@/lib/baby-plus";
import { formatTimeAmPm, parseTimeString } from "@/lib/time-utils";

type ProgramEndsLineProps = {
  startDate: Date;
  dailyTime: string;
  dateFormat?: string;
};

export function ProgramEndsLine({
  startDate,
  dailyTime,
  dateFormat = "EEEE, MMM d, yyyy",
}: ProgramEndsLineProps) {
  const ends = format(getProgramEnd(startDate), dateFormat);
  const timeLabel =
    dailyTime && parseTimeString(dailyTime) ? formatTimeAmPm(dailyTime) : null;

  return (
    <p className="text-xs text-muted-foreground">
      {timeLabel ? (
        <>
          Every {timeLabel} · Ends {ends}
        </>
      ) : (
        <>Ends {ends}</>
      )}
    </p>
  );
}
