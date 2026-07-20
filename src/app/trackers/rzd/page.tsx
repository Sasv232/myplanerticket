"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Train, Search, Clock, DollarSign, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface RzdTrain {
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cars: Array<{
    type: string;
    className: string;
    price: number;
    available: number;
    currency: string;
  }>;
}

export default function RzdTrackerPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RzdTrain[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/scrapers/rzd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, date }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка поиска");
        return;
      }

      setResults(data.trains || []);
      setSearched(true);
    } catch {
      setError("Не удалось выполнить поиск");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (train: RzdTrain) => {
    try {
      await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rzd",
          name: `${from} → ${to} (${train.trainNumber})`,
          config: {
            from,
            to,
            date,
            trainNumber: train.trainNumber,
            maxPrice: Math.min(...train.cars.map((c) => c.price)),
          },
        }),
      });
      alert(`Трекер "${train.trainNumber}" создан!`);
    } catch {
      alert("Ошибка создания трекера");
    }
  };

  const carTypeLabel: Record<string, string> = {
    seat: "Сидячий",
    platskart: "Плацкарт",
    compartment: "Купе",
    sv: "СВ",
  };

  return (
    <div>
      <Header
        title="РЖД — Билеты"
        description="Поиск и отслеживание билетов на поезда"
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-sm font-medium">Откуда</label>
              <Input
                placeholder="Москва"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-sm font-medium">Куда</label>
              <Input
                placeholder="Санкт-Петербург"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </div>
            <div className="min-w-[160px]">
              <label className="mb-1.5 block text-sm font-medium">Дата</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Найти
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-[var(--error)]/30">
          <CardContent className="flex items-center gap-3 p-4 text-[var(--error)]">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Найдено поездов: {results.length}
          </h2>
          {results.map((train) => (
            <Card key={train.trainNumber} className="hover:border-[var(--accent)]/30">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Train className="h-4 w-4 text-[var(--accent)]" />
                      <span className="font-semibold">{train.trainNumber}</span>
                      {train.trainName && (
                        <span className="text-sm text-[var(--secondary)]">{train.trainName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{train.departureTime}</span>
                      <ArrowRight className="h-3 w-3 text-[var(--secondary)]" />
                      <span className="font-medium">{train.arrivalTime}</span>
                      <span className="flex items-center gap-1 text-[var(--secondary)]">
                        <Clock className="h-3 w-3" />
                        {train.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {train.cars.map((car) => (
                      <div
                        key={car.type}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center"
                      >
                        <p className="text-xs text-[var(--secondary)]">
                          {carTypeLabel[car.type] || car.className}
                        </p>
                        <p className="text-sm font-bold text-[var(--accent)]">
                          {car.price.toLocaleString("ru-RU")} ₽
                        </p>
                        <p className="text-[10px] text-[var(--secondary)]">
                          {car.available} мест
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleTrack(train)}>
                    Отслеживать
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-[var(--secondary)]">
            <Train className="mb-3 h-10 w-10 opacity-50" />
            <p>Поезда не найдены</p>
            <p className="text-sm">Попробуйте изменить параметры поиска</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
