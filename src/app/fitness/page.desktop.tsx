"use client";

import { useState, useEffect, useCallback } from "react";
import { Droplets, Apple, Scale, Heart, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface FoodEntry { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; date: string; }
interface WaterEntry { id: string; amount: number; date: string; }
interface WeightEntry { id: string; weight: number; date: string; }
interface HealthProfile { height?: number; birthDate?: string; gender?: string; dailyCalorieGoal?: number; dailyWaterGoal?: number; }

const MEAL_TYPES = [
  { value: "breakfast", label: "Завтрак", emoji: "🌅" },
  { value: "lunch", label: "Обід", emoji: "☀️" },
  { value: "dinner", label: "Вечеря", emoji: "🌙" },
  { value: "snack", label: "Перекус", emoji: "🍎" },
];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function FitnessPageDesktop() {
  const [date, setDate] = useState(getToday());
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [waters, setWaters] = useState<WaterEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<HealthProfile>({});
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
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
  const [pWeight, setPWeight] = useState("");
  const [pBirth, setPBirth] = useState("");
  const [pGender, setPGender] = useState("male");
  const [pCalGoal, setPCalGoal] = useState("");
  const [pWaterGoal, setPWaterGoal] = useState("");

  const loadData = useCallback(async () => {
    const [f, w, wg, p] = await Promise.all([
      fetch(`/api/fitness/food?date=${date}`).then(r => r.json()).catch(() => []),
      fetch(`/api/fitness/water?date=${date}`).then(r => r.json()).catch(() => []),
      fetch(`/api/fitness/weight`).then(r => r.json()).catch(() => []),
      fetch("/api/fitness/profile").then(r => r.json()).catch(() => null),
    ]);
    setFoods(f);
    setWaters(w);
    setWeights(wg);
    if (p) {
      setProfile(p);
      setPHeight(p.height?.toString() || "");
      setPWeight(wg[0]?.weight?.toString() || "");
      setPBirth(p.birthDate || "");
      setPGender(p.gender || "male");
      setPCalGoal(p.dailyCalorieGoal?.toString() || "");
      setPWaterGoal(p.dailyWaterGoal?.toString() || "");
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); };

  const addFood = async () => {
    if (!foodName || !foodCal) return;
    await fetch("/api/fitness/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: foodName, calories: +foodCal, protein: +foodProtein || 0,
        carbs: +foodCarbs || 0, fat: +foodFat || 0, mealType: foodMeal, date,
      }),
    });
    setFoodName(""); setFoodCal(""); setFoodProtein(""); setFoodCarbs(""); setFoodFat("");
    setShowFoodForm(false);
    loadData();
  };

  const addWater = async (amount: number) => {
    await fetch("/api/fitness/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, date }),
    });
    loadData();
  };

  const addWeight = async () => {
    if (!weightValue) return;
    await fetch("/api/fitness/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: +weightValue, date }),
    });
    setWeightValue("");
    setShowWeightForm(false);
    loadData();
  };

  const saveProfile = async () => {
    await fetch("/api/fitness/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        height: +pHeight || null, birthDate: pBirth || null,
        gender: pGender, dailyCalorieGoal: +pCalGoal || null,
        dailyWaterGoal: +pWaterGoal || null,
      }),
    });
    setShowProfile(false);
    loadData();
  };

  const deleteFood = async (id: string) => {
    await fetch(`/api/fitness/food?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const deleteWater = async (id: string) => {
    await fetch(`/api/fitness/water?id=${id}`, { method: "DELETE" });
    loadData();
  };

  const totalCal = foods.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = foods.reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = foods.reduce((s, f) => s + (f.fat || 0), 0);
  const totalWater = waters.reduce((s, w) => s + w.amount, 0);
  const latestWeight = weights[0]?.weight;

  const bmi = pHeight && latestWeight ? (Number(latestWeight) / ((Number(pHeight) / 100) ** 2)).toFixed(1) : null;
  const bmiLabel = bmi ? (+bmi < 18.5 ? "Недовага" : +bmi < 25 ? "Норма" : +bmi < 30 ? "Надвага" : "Ожиріння") : null;

  const formatDate = (d: string) => {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">🏋️ Фітнес-трекер</h1>
        <button onClick={() => setShowProfile(!showProfile)} className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-2">
          <Heart className="h-4 w-4" /> Профіль
        </button>
      </div>

      {showProfile && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">🏥 Здоров&apos;я та цілі</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-[var(--muted)]">Зріст (см)</label>
              <input type="number" value={pHeight} onChange={e => setPHeight(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Дата народження</label>
              <input type="date" value={pBirth} onChange={e => setPBirth(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Стать</label>
              <select value={pGender} onChange={e => setPGender(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1">
                <option value="male">Чоловік</option>
                <option value="female">Жінка</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Вага (кг)</label>
              <input type="number" step="0.1" value={pWeight} onChange={e => setPWeight(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Ціль калорій (ккал/день)</label>
              <input type="number" value={pCalGoal} onChange={e => setPCalGoal(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Ціль води (мл/день)</label>
              <input type="number" value={pWaterGoal} onChange={e => setPWaterGoal(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm mt-1" />
            </div>
          </div>
          <button onClick={saveProfile} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">Зберегти</button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <button onClick={prevDay} className="p-2 rounded-xl hover:bg-[var(--surface)]"><ChevronLeft className="h-5 w-5" /></button>
        <span className="font-semibold text-lg">{new Date(date).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}</span>
        <button onClick={nextDay} className="p-2 rounded-xl hover:bg-[var(--surface)]"><ChevronRight className="h-5 w-5" /></button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">🔥 Калорії</p>
          <p className="text-2xl font-bold">{Math.round(totalCal)} <span className="text-sm font-normal text-[var(--muted)]">/ {profile.dailyCalorieGoal || "—"} ккал</span></p>
          <div className="mt-2 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalCal / (profile.dailyCalorieGoal || 2000)) * 100)}%` }} />
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">💧 Вода</p>
          <p className="text-2xl font-bold">{Math.round(totalWater)} <span className="text-sm font-normal text-[var(--muted)]">/ {profile.dailyWaterGoal || "—"} мл</span></p>
          <div className="mt-2 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalWater / (profile.dailyWaterGoal || 2000)) * 100)}%` }} />
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">⚖️ Вага</p>
          <p className="text-2xl font-bold">{latestWeight ? `${latestWeight} кг` : "—"}</p>
          {bmi && <p className="text-xs text-[var(--muted)] mt-1">ІМТ: {bmi} ({bmiLabel})</p>}
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-[var(--muted)] mb-1">📊 БЖУ</p>
          <div className="flex gap-4 mt-1">
            <div><p className="text-lg font-bold text-red-500">{Math.round(totalProtein)}г</p><p className="text-[10px] text-[var(--muted)]">Білок</p></div>
            <div><p className="text-lg font-bold text-yellow-500">{Math.round(totalCarbs)}г</p><p className="text-[10px] text-[var(--muted)]">Вуглеводи</p></div>
            <div><p className="text-lg font-bold text-green-500">{Math.round(totalFat)}г</p><p className="text-[10px] text-[var(--muted)]">Жири</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Apple className="h-4 w-4 text-green-500" /> Харчування</h3>
            <button onClick={() => setShowFoodForm(!showFoodForm)} className="p-2 rounded-xl hover:bg-[var(--surface)]"><Plus className="h-4 w-4" /></button>
          </div>
          {showFoodForm && (
            <div className="bg-[var(--surface)] rounded-xl p-4 mb-4 space-y-3">
              <input placeholder="Назва страви" value={foodName} onChange={e => setFoodName(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
              <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Калорії" value={foodCal} onChange={e => setFoodCal(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
                <input type="number" placeholder="Білок (г)" value={foodProtein} onChange={e => setFoodProtein(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
                <input type="number" placeholder="Вуглеводи (г)" value={foodCarbs} onChange={e => setFoodCarbs(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
                <input type="number" placeholder="Жири (г)" value={foodFat} onChange={e => setFoodFat(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" />
              </div>
              <select value={foodMeal} onChange={e => setFoodMeal(e.target.value)} className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm">
                {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
              </select>
              <button onClick={addFood} className="w-full h-10 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">Додати</button>
            </div>
          )}
          {Object.entries(MEAL_TYPES).map(([key, meal]) => {
            const mealFoods = foods.filter(f => f.mealType === key);
            if (mealFoods.length === 0) return null;
            return (
              <div key={key} className="mb-3">
                <p className="text-xs text-[var(--muted)] mb-1">{meal.emoji} {meal.label}</p>
                {mealFoods.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span>{f.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--muted)]">{f.calories} ккал</span>
                      <button onClick={() => deleteFood(f.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {foods.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">Немає записів</p>}
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-500" /> Вода</h3>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[150, 250, 350, 500].map(amount => (
              <button key={amount} onClick={() => addWater(amount)} className="h-12 rounded-xl bg-blue-500/10 text-blue-600 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                +{amount} мл
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {waters.map(w => (
              <div key={w.id} className="flex items-center justify-between py-1.5 text-sm">
                <span>💧 {w.amount} мл</span>
                <button onClick={() => deleteWater(w.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          {waters.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">Немає записів</p>}

          <div className="border-t border-[var(--border)] mt-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Scale className="h-4 w-4 text-purple-500" /> Вага</h3>
              <button onClick={() => setShowWeightForm(!showWeightForm)} className="p-2 rounded-xl hover:bg-[var(--surface)]"><Plus className="h-4 w-4" /></button>
            </div>
            {showWeightForm && (
              <div className="flex gap-2 mb-3">
                <input type="number" step="0.1" placeholder="Вага (кг)" value={weightValue} onChange={e => setWeightValue(e.target.value)} className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" />
                <button onClick={addWeight} className="px-4 h-10 rounded-xl bg-[var(--accent)] text-white text-sm font-medium">ОК</button>
              </div>
            )}
            {weights.slice(0, 7).map(w => (
              <div key={w.id} className="flex items-center justify-between py-1.5 text-sm">
                <span>⚖️ {w.weight} кг — {formatDate(w.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
