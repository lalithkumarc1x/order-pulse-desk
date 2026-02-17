import { useState, useMemo } from 'react';
import { staffMembers } from '@/store/useKmsStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['06:00-10:00', '10:00-14:00', '14:00-18:00', '18:00-22:00'];

// Mock forecast: recommended staff count per slot
const forecast: Record<string, Record<string, number>> = {
  Mon: { '06:00-10:00': 2, '10:00-14:00': 4, '14:00-18:00': 3, '18:00-22:00': 4 },
  Tue: { '06:00-10:00': 2, '10:00-14:00': 4, '14:00-18:00': 3, '18:00-22:00': 4 },
  Wed: { '06:00-10:00': 2, '10:00-14:00': 5, '14:00-18:00': 4, '18:00-22:00': 5 },
  Thu: { '06:00-10:00': 2, '10:00-14:00': 5, '14:00-18:00': 4, '18:00-22:00': 5 },
  Fri: { '06:00-10:00': 3, '10:00-14:00': 6, '14:00-18:00': 5, '18:00-22:00': 6 },
  Sat: { '06:00-10:00': 3, '10:00-14:00': 6, '14:00-18:00': 5, '18:00-22:00': 6 },
  Sun: { '06:00-10:00': 2, '10:00-14:00': 4, '14:00-18:00': 3, '18:00-22:00': 3 },
};

function slotOverlaps(staffSlot: string, gridSlot: string): boolean {
  const [sS, sE] = staffSlot.split('-').map(t => parseInt(t));
  const [gS, gE] = gridSlot.split('-').map(t => parseInt(t));
  return sS < gE && gS < sE;
}

export default function SchedulerPage() {
  const [dragItem, setDragItem] = useState<{ staffId: string; fromDay: string; fromSlot: string } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Record<string, string[]>>>(() => {
    const map: Record<string, Record<string, string[]>> = {};
    for (const day of DAYS) {
      map[day] = {};
      for (const slot of SLOTS) {
        map[day][slot] = staffMembers
          .filter(s => s.schedule[day]?.some(ss => slotOverlaps(ss, slot)))
          .map(s => s.id);
      }
    }
    return map;
  });

  const handleDrop = (day: string, slot: string) => {
    if (!dragItem) return;
    setAssignments(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      // Remove from old
      const oldList = updated[dragItem.fromDay]?.[dragItem.fromSlot];
      if (oldList) {
        updated[dragItem.fromDay][dragItem.fromSlot] = oldList.filter((id: string) => id !== dragItem.staffId);
      }
      // Add to new
      if (!updated[day]) updated[day] = {};
      if (!updated[day][slot]) updated[day][slot] = [];
      if (!updated[day][slot].includes(dragItem.staffId)) {
        updated[day][slot].push(dragItem.staffId);
      }
      return updated;
    });
    setDragItem(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-foreground mb-4">Staff Scheduler</h1>
      <p className="text-xs text-muted-foreground mb-4">Drag staff between slots. Green numbers = forecast recommendation.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-muted-foreground font-medium border-b border-border w-24">Slot</th>
              {DAYS.map(d => (
                <th key={d} className="py-2 px-3 text-center text-muted-foreground font-medium border-b border-border">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(slot => (
              <tr key={slot}>
                <td className="py-2 px-3 font-mono-data text-xs text-muted-foreground border-b border-border/50 whitespace-nowrap">{slot}</td>
                {DAYS.map(day => {
                  const staffIds = assignments[day]?.[slot] || [];
                  const recommended = forecast[day]?.[slot] || 0;
                  const isCovered = staffIds.length >= recommended;
                  return (
                    <td
                      key={day}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(day, slot)}
                      className={`py-2 px-2 border-b border-border/50 align-top min-w-[120px] ${!isCovered ? 'bg-destructive/5' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-mono-data ${isCovered ? 'text-success' : 'text-destructive'}`}>
                          {staffIds.length}/{recommended}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {staffIds.map(sid => {
                          const staff = staffMembers.find(s => s.id === sid);
                          return (
                            <span
                              key={sid}
                              draggable
                              onDragStart={() => setDragItem({ staffId: sid, fromDay: day, fromSlot: slot })}
                              className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing select-none"
                              title={`${staff?.name} — ${staff?.role}`}
                            >
                              {staff?.name.split(' ')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Staff Legend</h3>
        <div className="flex flex-wrap gap-3">
          {staffMembers.map(s => (
            <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {s.name} — {s.role} (${s.hourlyRate}/hr)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
