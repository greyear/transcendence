# Core Database Schema Guide

> **For: Product Managers, Designers, and Non-Technical Stakeholders**
>
> This guide explains how the recipe app's database is organized. No SQL knowledge needed!

---

## 🎯 The Big Picture

The database stores **5 main things**:

1. **Users** — People using the app
2. **Recipes** — Cooking instructions with ingredients
3. **Ingredients** — All available food items
4. **Categories & Metadata** — Organize recipes and ingredients
5. **User Preferences** — Allergens, diets, followers

---

## 1️⃣ Users & Social (The People Section)

### **Users Table**
Stores basic profile info for each person.

| What | Example |
|------|---------|
| Username | `chef_anna` |
| Avatar | Link to profile photo |
| Status | `online` or `offline` |
| Role | `admin`, `user`, or `guest` |
| Last seen | When they were last active |

### **Followers Table**
Who follows whom. Think Twitter/Instagram.

- **User A** follows **User B** = one row
- If they follow each other = **they're friends**
- Related to privacy: followers can see your status (online/offline)

---

## 2️⃣ Recipes & Ingredients (The Content)

### **Recipes Table**
The actual recipes with cooking instructions.

| Field | Purpose |
|-------|---------|
| **Title** | "Pasta Carbonara" (in English, Finnish, Russian) |
| **Description** | Short summary (multilingual JSON) |
| **Instructions** | Step-by-step directions (multilingual JSON) |
| **Servings** | How many people it feeds |
| **Spiciness** | 0 = mild, 1 = mild, 2 = medium, 3 = hot |
| **Author** | Who created it (User ID) |
| **Status** | `draft` → `moderation` → `published` → `archived` |
| **Rating** | Average score (1-5 stars) + number of ratings |

**Example flow:**
```
Author writes recipe (draft)
   ↓
Admin reviews it (moderation)
   ↓
Goes live (published)
   ↓
Recipe can be archived when old/replaced
```

### **Ingredients Table**
Master list of all food items.

| Field | Example |
|-------|---------|
| Name (unique) | "Chicken Breast", "Tomato", "Olive Oil" |

### **Units Table**
Measurements used in recipes.

| Type | Examples |
|------|----------|
| **Mass** | grams, kg, oz, lb |
| **Volume** | ml, liter, cup, tbsp |
| **Portion** | pieces, slices, bunches |

### **Recipe ↔ Ingredients Link**
Connects recipes to their ingredients with amounts.

```
Recipe: "Pasta Carbonara"
  ├─ 400g pasta
  ├─ 200g bacon
  ├─ 3 eggs
  └─ 100g parmesan
```

---

## 3️⃣ Organizing Recipes (The Navigation)

### **Recipe Categories (Multi-Type)**

Recipes can be tagged with multiple **types** of categories:

```
🍽️  MEAL TIME          DISH TYPE            MAIN INGREDIENT       CUISINE
├─ Breakfast          ├─ Soup               ├─ Chicken            ├─ Italian
├─ Lunch              ├─ Dessert            ├─ Beef               ├─ Asian
├─ Dinner             ├─ Salad              ├─ Fish               ├─ Mexican
└─ Snack              ├─ Beverage           └─ Vegetarian         └─ Indian
                      └─ Main Course
```

**One recipe can have tags from each:**
- Pasta Carbonara = `Dinner` + `Main Course` + `Pork` + `Italian`

---

## 4️⃣ User Preferences (Allergens & Diets)

### **Allergens**
Master list: peanuts, milk, gluten, shellfish, etc.

**User Allergens:** Which allergens *you personally* avoid
- ✅ Can check recipes: "Is this safe for my allergies?"

### **Ingredient Category ↔ Allergen Mapping**
Links **ingredient types** to allergens:

```
INGREDIENT CATEGORY → ALLERGEN
├─ Shellfish → 🦐 Shellfish allergen
├─ Peanuts → 🥜 Peanut allergen
├─ Dairy → 🥛 Milk allergen
└─ Wheat → 🌾 Gluten allergen
```

When checking a recipe:
1. Get all ingredients
2. Find their categories
3. Check if any are linked to user's allergens
4. ⚠️ Show warning if match found

### **Diets**
Master list: vegan, vegetarian, keto, gluten-free, etc.

**User Diets:** Which diets *you follow*
- ✅ Can check recipes: "Does this fit my diet?"

**Diet ↔ Ingredient Category Mapping:**
```
DIET → RESTRICTED CATEGORIES
├─ Vegan → [Meat, Dairy, Eggs, Honey]
├─ Vegetarian → [Meat, Fish]
├─ Keto → [Grains, Sugar]
└─ Gluten-Free → [Wheat, Barley]
```

When checking a recipe:
1. Get all ingredients
2. Find their categories
3. Check if any are restricted by user's diet
4. ⚠️ Show warning if conflict found

---

## 5️⃣ Nutrition & Conversions

### **Unit Conversions**
Store relationship: **1 unit = X grams**

```
Example for Butter:
├─ 1 tbsp = 15g
├─ 1 cup = 227g
└─ 1 oz = 28g
```

Why? Recipes use different units, but nutrition is always per 100g.
- Convert any unit → grams → calculate nutrition

### **Nutrition Facts**
Per ingredient (per base unit, e.g., per 100g):
- Calories
- Protein
- Fat
- Carbs

**Example:**
```
Chicken Breast (per 100g)
├─ Calories: 165
├─ Protein: 31g
├─ Fat: 3.6g
└─ Carbs: 0g
```

---

## 🔗 How It All Connects

```
USER
├─ Follows other USERS
├─ Authors RECIPES
├─ Has ALLERGENS
├─ Follows DIETS
└─ Views/Rates RECIPES

RECIPE
├─ Has many INGREDIENTS (via recipe_ingredients)
├─ Belongs to many CATEGORIES (meal_time, cuisine, etc.)
├─ Has RATINGS
└─ Written by a USER (author)

INGREDIENT
├─ Has many UNITS (via unit_conversions)
├─ Belongs to CATEGORIES (dairy, meat, vegetable)
├─ Links to ALLERGENS (peanut ingredient → peanut allergen)
└─ Has NUTRITION FACTS (per 100g, for example)

CATEGORY TYPE (meal_time, cuisine, dish_type)
└─ Contains many CATEGORIES

ALLERGEN & DIET
└─ Restricted by INGREDIENT CATEGORIES
```

---

## 📊 Real-World Example: Checking if Recipe is Safe

**User: Anna**
- ❌ Allergic to: Peanuts, Shellfish
- 🌱 Follows: Vegetarian diet

**Recipe: "Spicy Shrimp Pad Thai"**

```
Ingredients:
1. Shrimp → Category: Shellfish → Linked to "Shellfish" allergen ⚠️
2. Peanuts (garnish) → Category: Legumes/Nuts → Linked to "Peanut" allergen ⚠️
3. Rice noodles → Category: Grains → OK
4. Vegetables → Category: Vegetables → OK

Diet Check:
- Vegetarian diet restricts: [Meat, Seafood, Fish]
- Recipe has: Shrimp ⚠️
- Verdict: NOT vegetarian

Result for Anna: 🚫 RECIPE NOT SUITABLE
- ❌ Contains peanuts (allergen)
- ❌ Contains shrimp (allergen)
- ❌ Not vegetarian
```

---

## 🎨 Visual Schema

For a detailed visual diagram, see: [`data_model.dbml`](../data_model.dbml)

You can visualize it at: https://dbdiagram.io/ (paste the DBML content)

---

## 📝 Key Takeaways

| Concept | Purpose |
|---------|---------|
| **Users** | Profiles, social follow graph |
| **Recipes** | Main content with multilingual support |
| **Ingredients** | Master food items list |
| **Categories** | Tag recipes by meal type, cuisine, main ingredient |
| **Allergens & Diets** | Filter recipes for user safety & preferences |
| **Nutrition & Units** | Support recipe scaling and nutrition tracking |

---

**Questions?** Check the detailed SQL schema in `01-init-core.sql` or the DBML diagram.
