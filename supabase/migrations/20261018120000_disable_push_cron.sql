-- Stop the minute cron that calls send-due-reminders while browser push is unused.

do $$
begin
  begin
    perform cron.unschedule('send-due-push-reminders');
  exception when others then
    raise notice 'push cron already stopped or unavailable: %', sqlerrm;
  end;
end $$;
