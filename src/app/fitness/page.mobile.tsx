"use client";

import { useState, useEffect, useCallback } from "react";
import { Droplets, Apple, Scale, Heart, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface FoodEntry { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; date: string; }
interface WaterEntry { id: string; amount: number; date: string; }
interface WeightEntry { id: string; weight: number; date: string; }
interface HealthProfile { height?: number; birthDate?: string; gender?: string; dailyCalorieGoal?: number; dailyWaterGoal?: number; }

const MEAL_TYPES = [
  { value: "breakfast", label: "Сніданок", emoji: "🌅" },
  { value: "lunch", label: "Обід", emoji: "☀️" },
  { value: "dinner", label: "Вечеря", emoji: "🌙" },
  { value: "snack", label: "Перекус", emoji: "🍎" },
];

function getToday() { return new Date().toISOString().split("T")[0]; }

export function FitnessPageMobile() {
  const [date, setDate] = useState(getToday());
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [waters, setWaters] = useState<WaterEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<HealthProfile>({});
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodCal, setFoodCal] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodMeal, setFoodMeal] = useState("breakfast");
  const [waterAmount, setWaterAmount] = useState("250");
  const [weightValue, setWeightValue] = useState("");
  const [pHeight, setPHeight] = useState("");
  const [pCalGoal, setPCalGoal] = useState("");
  const [pWaterGoal, setPWaterGoal] = useState("");

  const loadData = useCallback(async () => {
    const [f, w, wg, p] = await Promise.all([
      fetch(`/api/fitness/food?date=${date}`).then(r => r.json()).catch(() => []),
      fetch(`/api/fitness/water?date=${date}`).then(r => r.json()).catch(() => []),
      fetch(`/api/fitness/weight`).then(r => r.json()).catch(() => []),
      fetch("/api/fitness/profile").then(r => r.json()).catch(() => null),
    ]);
    setFoods(f); setWaters(w); setWeights(wg);
    if (p) { setProfile(p); setPHeight(p.height?.toString() || ""); setPCalGoal(p.dailyCalorieGoal?.toString() || ""); setPWaterGoal(p.dailyWaterGoal?.toString() || ""); }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); };

  const addFood = async () => {
    if (!foodName || !foodCal) return;
    await fetch("/api/fitness/food", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: foodName, calories: +foodCal, protein: +foodProtein || 0, carbs: +foodCarbs || 0, fat: +foodFat || 0, mealType: foodMeal, date }) });
    setFoodName(""); setFoodCal(""); setFoodProtein(""); setFoodCarbs(""); setFoodFat(""); setShowFoodForm(false); loadData();
  };

  const addWater = async (amount: number) => {
    await fetch("/api/fitness/water", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, date }) }); loadData();
  };

  const addWeight = async () => {
    if (!weightValue) return;
    await fetch("/api/fitness/weight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weight: +weightValue, date }) });
    setWeightValue(""); setShowWeightForm(false); loadData();
  };

  const saveProfile = async () => {
    await fetch("/api/fitness/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ height: +pHeight || null, dailyCalorieGoal: +pCalGoal || null, dailyWaterGoal: +pWaterGoal || null }) });
    setShowProfile(false); loadData();
  };

  const deleteFood = async (id: string) => { await fetch(`/api/fitness/food?id=${id}`, { method: "DELETE" }); loadData(); };
  const deleteWater = async (id: string) => { await fetch(`/api/fitness/water?id=${id}`, { method: "DELETE" }); loadData(); };

  const totalCal = foods.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = foods.reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = foods.reduce((s, f) => s + (f.fat || 0), 0);
  const totalWater = waters.reduce((s, w) => s + w.amount, 0);
  const latestWeight = weights[0]?.weight;
  const bmi = pHeight && latestWeight ? (Number(latestWeight) / ((Number(pHeight) / 100) ** 2)).toFixed(1) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🏋️ Фітнес</h1>
        <button onClick={() => setShowProfile(!showProfile)} className="p-2 rounded-xl hover:bg-[var(--surface)]"><Heart className="h-5 w-5" /></button>
      </div>

      {showProfile && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">Профіль здоров&apos;я</h3>
          <input type="number" placeholder="Зріст (см)" value={pHeight} onChange={e => setPHeight(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          <input type="number" placeholder="Ціль калорій" value={pCalGoal} onChange={e => setPCalGoal(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          <input type="number" placeholder="Ціль води (мл)" value={pWaterGoal} onChange={e => setPWaterGoal(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
          <button onClick={saveProfile} className="w-full h-10 rounded-xl bg-[var(--accent)] text-white text-sm">Зберегти</button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={prevDay} className="p-2 rounded-xl hover:bg-[var(--surface)]"><ChevronLeft className="h-5 w-5" /></button>
        <span className="font-semibold text-sm">{new Date(date).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}</span>
        <button onClick={nextDay} className="p-2 rounded-xl hover:bg-[var(--surface)]"><ChevronRight className="h-5 w-5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-[10px] text-[var(--muted)]">🔥 Калорії</p>
          <p className="text-lg font-bold">{Math.round(totalCal)}<span className="text-[10px] text-[var(--muted)]">/{profile.dailyCalorieGoal || "—"}</span></p>
          <div className="mt-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (totalCal / (profile.dailyCalorieGoal || 2000)) * 100)}%` }} /></div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-[10px] text-[var(--muted)]">💧 Вода</p>
          <p className="text-lg font-bold">{Math.round(totalWater)}<span className="text-[10px] text-[var(--muted)]">/{profile.dailyWaterGoal || "—"} мл</span></p>
          <div className="mt-1 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (totalWater / (profile.dailyWaterGoal || 2000)) * 100)}%` }} /></div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-[10px] text-[var(--muted)]">⚖️ Вага</p>
          <p className="text-lg font-bold">{latestWeight ? `${latestWeight}кг` : "—"}</p>
          {bmi && <p className="text-[10px] text-[var(--muted)]">ІМТ: {bmi}</p>}
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
          <p className="text-[10px] text-[var(--muted)]">📊 БЖУ</p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-red-500">{Math.round(totalProtein)}Б</span>
            <span className="text-yellow-500">{Math.round(totalCarbs)}В</span>
            <span className="text-green-500">{Math.round(totalFat)}Ж</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-1"><Apple className="h-4 w-4 text-green-500" /> Їжа</h3>
          <button onClick={() => setShowFoodForm(!showFoodForm)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]"><Plus className="h-4 w-4" /></button>
        </div>
        {showFoodForm && (
          <div className="bg-[var(--surface)] rounded-lg p-3 mb-3 space-y-2">
            <input placeholder="Назва" value={foodName} onChange={e => setFoodName(e.target.value)} className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="ккал" value={foodCal} onChange={e => setFoodCal(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs" />
              <select value={foodMeal} onChange={e => setFoodMeal(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 text-xs">
                {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
              </select>
            </div>
            <button onClick={addFood} className="w-full h-9 rounded-lg bg-[var(--accent)] text-white text-xs">Додати</button>
          </div>
        )}
        {foods.map(f => (
          <div key={f.id} className="flex items-center justify-between py-1.5 text-xs">
            <span>{MEAL_TYPES.find(m => m.value === f.mealType)?.emoji} {f.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">{f.calories}ккал</span>
              <button onClick={() => deleteFood(f.id)} className="text-red-400"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {foods.length === 0 && <p className="text-xs text-[var(--muted)] text-center py-3">Порожньо</p>}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="font-semibold text-sm flex items-center gap-1 mb-3"><Droplets className="h-4 w-4 text-blue-500" /> Вода</h3>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[150, 250, 350, 500].map(amount => (
            <button key={amount} onClick={() => addWater(amount)} className="h-9 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-medium">+{amount}</button>
          ))}
        </div>
        {waters.map(w => (
          <div key={w.id} className="flex items-center justify-between py-1 text-xs">
            <span>💧 {w.amount} мл</span>
            <button onClick={() => deleteWater(w.id)} className="text-red-400"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-1"><Scale className="h-4 w-4 text-purple-500" /> Вага</h3>
          <button onClick={() => setShowWeightForm(!showWeightForm)} className="p-1.5 rounded-lg hover:bg-[var(--surface)]"><Plus className="h-4 w-4" /></button>
        </div>
        {showWeightForm && (
          <div className="flex gap-2 mb-3">
            <input type="number" step="0.1" placeholder="кг" value={weightValue} onChange={e => setWeightValue(e.target.value)} className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs" />
            <button onClick={addWeight} className="px-3 h-9 rounded-lg bg-[var(--accent)] text-white text-xs">ОК</button>
          </div>
        )}
        {weights.slice(0, 7).map(w => (
          <div key={w.id} className="py-1 text-xs">⚖️ {w.weight} кг</div>
        ))}
      </div>
    </div>
  );
}
