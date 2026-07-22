"use client";

import { useState, useEffect, useCallback } from "react";
import { Droplets, Apple, Scale, Heart, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/context";

interface FoodEntry { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; date: string; }
interface WaterEntry { id: string; amount: number; date: string; }
interface WeightEntry { id: string; weight: number; date: string; }
interface HealthProfile { height?: number; birthDate?: string; gender?: string; dailyCalorieGoal?: number; dailyWaterGoal?: number; }

function getToday() { return new Date().toISOString().split("T")[0]; }

export function FitnessPageMobile() {
  const { t } = useLang();

  const MEAL_TYPES = [
    { value: "breakfast", label: t("fitness_breakfast"), emoji: "🌅" },
    { value: "lunch", label: t("fitness_lunch"), emoji: "☀️" },
    { value: "dinner", label: t("fitness_dinner"), emoji: "🌙" },
    { value: "snack", label: t("fitness_snack"), emoji: "🍎" },
  ];

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
    <div className="mobile-main">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]/50 px-5 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🏋️ {t("fitness_title")}</h1>
        <button onClick={() => setShowProfile(!showProfile)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all">
          <Heart className="h-5 w-5 text-[var(--secondary)]" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Health profile form */}
        {showProfile && (
          <div className="mobile-section p-5 space-y-4">
            <h3 className="text-base font-semibold">{t("fitness_health")}</h3>
            <input type="number" placeholder={t("fitness_height")} value={pHeight} onChange={e => setPHeight(e.target.value)} className="mobile-input" />
            <input type="number" placeholder={t("fitness_cal_goal")} value={pCalGoal} onChange={e => setPCalGoal(e.target.value)} className="mobile-input" />
            <input type="number" placeholder={t("fitness_water_goal")} value={pWaterGoal} onChange={e => setPWaterGoal(e.target.value)} className="mobile-input" />
            <button onClick={saveProfile} className="mobile-btn mobile-btn-primary w-full">{t("fitness_save")}</button>
          </div>
        )}

        {/* Date navigation */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={prevDay} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold">{new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
          <button onClick={nextDay} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] active:scale-95 transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="mobile-section p-5">
            <p className="text-xs text-[var(--muted)] mb-1">🔥 {t("fitness_calories")}</p>
            <p className="text-2xl font-bold">{Math.round(totalCal)}<span className="text-xs text-[var(--muted)]">/{profile.dailyCalorieGoal || "—"}</span></p>
            <div className="mt-2 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalCal / (profile.dailyCalorieGoal || 2000)) * 100)}%` }} />
            </div>
          </div>
          <div className="mobile-section p-5">
            <p className="text-xs text-[var(--muted)] mb-1">💧 {t("fitness_water")}</p>
            <p className="text-2xl font-bold">{Math.round(totalWater)}<span className="text-xs text-[var(--muted)]">/{profile.dailyWaterGoal || "—"} мл</span></p>
            <div className="mt-2 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalWater / (profile.dailyWaterGoal || 2000)) * 100)}%` }} />
            </div>
          </div>
          <div className="mobile-section p-5">
            <p className="text-xs text-[var(--muted)] mb-1">⚖️ {t("fitness_weight_title")}</p>
            <p className="text-2xl font-bold">{latestWeight ? `${latestWeight}кг` : "—"}</p>
            {bmi && <p className="text-xs text-[var(--muted)] mt-1">ИМТ: {bmi}</p>}
          </div>
          <div className="mobile-section p-5">
            <p className="text-xs text-[var(--muted)] mb-1">📊 {t("fitness_bju")}</p>
            <div className="flex gap-3 text-sm mt-2">
              <span className="text-red-500 font-semibold">{Math.round(totalProtein)}Б</span>
              <span className="text-yellow-500 font-semibold">{Math.round(totalCarbs)}В</span>
              <span className="text-green-500 font-semibold">{Math.round(totalFat)}Ж</span>
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="mobile-section p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2"><Apple className="h-5 w-5 text-green-500" /> {t("fitness_nutrition")}</h3>
            <button onClick={() => setShowFoodForm(!showFoodForm)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showFoodForm && (
            <div className="bg-[var(--surface)] rounded-2xl p-4 mb-4 space-y-3">
              <input placeholder={t("fitness_food_name")} value={foodName} onChange={e => setFoodName(e.target.value)} className="mobile-input h-11 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="ккал" value={foodCal} onChange={e => setFoodCal(e.target.value)} className="mobile-input h-11 text-sm" />
                <select value={foodMeal} onChange={e => setFoodMeal(e.target.value)} className="mobile-input h-11 text-sm">
                  {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
                </select>
              </div>
              <button onClick={addFood} className="mobile-btn mobile-btn-primary w-full h-11 text-sm">{t("fitness_add")}</button>
            </div>
          )}
          <div className="space-y-3">
            {foods.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{MEAL_TYPES.find(m => m.value === f.mealType)?.emoji} {f.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted)]">{f.calories}ккал</span>
                  <button onClick={() => deleteFood(f.id)} className="text-red-400 active:scale-90 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {foods.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">{t("fitness_empty")}</p>}
          </div>
        </div>

        {/* Water */}
        <div className="mobile-section p-5">
          <h3 className="text-base font-semibold flex items-center gap-2 mb-4"><Droplets className="h-5 w-5 text-blue-500" /> {t("fitness_water")}</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[150, 250, 350, 500].map(amount => (
              <button key={amount} onClick={() => addWater(amount)} className="h-11 rounded-2xl bg-blue-500/10 text-blue-600 text-sm font-semibold active:scale-95 transition-all">
                +{amount}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {waters.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 text-sm">
                <span>💧 {w.amount} мл</span>
                <button onClick={() => deleteWater(w.id)} className="text-red-400 active:scale-90 transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="mobile-section p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold flex items-center gap-2"><Scale className="h-5 w-5 text-purple-500" /> {t("fitness_weight_title")}</h3>
            <button onClick={() => setShowWeightForm(!showWeightForm)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] active:scale-95 transition-all">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showWeightForm && (
            <div className="flex gap-3 mb-4">
              <input type="number" step="0.1" placeholder="кг" value={weightValue} onChange={e => setWeightValue(e.target.value)} className="mobile-input h-11 text-sm flex-1" />
              <button onClick={addWeight} className="mobile-btn mobile-btn-primary h-11 px-6 text-sm">ОК</button>
            </div>
          )}
          <div className="space-y-2">
            {weights.slice(0, 7).map(w => (
              <div key={w.id} className="py-2 text-sm">⚖️ {w.weight} кг</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
