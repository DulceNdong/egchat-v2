# Implementation Plan — Stories Reorganization + Video + MyStoriesManagerModal

Generated from reading:
- `egchat-mobile/app/stories.tsx` (~2600 lines, fully read)
- `egchat-mobile/app/moments.tsx` (~700 lines, fully read)
- `egchat-mobile/src/components/MomentCameraEditor.tsx` (exports `MomentMedia = { uri, type: 'photo'|'video', filter?, textLayers?, stickers?, music? }`)
- `egchat-mobile/src/utils/chatMedia.ts` (exports `pickVideo(): Promise<PickedAsset|null>`, `PickedAsset = { uri, fileName, mimeType, size? }`)
- `egchat-mobile/src/utils/storyMediaStorage.ts` (exports `uploadStoryMediaToSupabase(userId, uri, 'image'|'video'): Promise<string|null>`)
- `egchat-mobile/src/api.ts` (`storiesAPI` has: `getAll`, `create`, `delete(id)`, `registerView`, `reply`, `react` — **no `deleteMedia` method exists**)

---

## Key findings

1. **Current `StoryTab` type**: `'estados' | 'streaming' | 'canales' | 'momentos'` — four flat tabs.
2. **`pendingMediaRef`**: `React.useRef<MomentMedia | null>(null)` — used by `MomentCreateModal` to pre-populate images.
3. **`handleMomentCameraDone`**: already uploads and sets `pendingMediaRef.current`, then opens `showMomentCreate` — but it always treats the result as an image.
4. **`MomentCreateModal`**: has `images` state only, no `videos`. It uses `pendingMedia?.uri` as a pre-populated image regardless of `type`.
5. **`createMomentPost`**: uploads images to Supabase and POSTs `{ text, images }` — no `videos` field.
6. **`storiesAPI.deleteMedia`** does not exist. Individual story-media deletion must fall back to deleting the whole story with an Alert warning.
7. **SafeAreaView** root uses `edges={['left', 'right', 'bottom']}` — must not change.
8. **Moments FlatList** already has `contentContainerStyle={{ paddingBottom: 40 }}` — needs to be changed to `paddingBottom: insets.bottom + 20` in the new sub_momentos path.
9. **Streaming tab content** already in a `ScrollView` — needs `contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}` added.
10. **`moments.tsx` `CreatePostModal`**: uses `pendingMedia?.uri` with no type check; always populates `images`.

---

## Item 1 — Type changes in `stories.tsx`

### What to do
Replace the single `StoryTab` union type with two types, and add `activeSubTab` state.

### Exact change

**Find** (line ~49):
```typescript
type StoryTab = 'estados' | 'streaming' | 'canales' | 'momentos';
```

**Replace with**:
```typescript
type StoryTab = 'estados' | 'canales';
type EstadoSubTab = 'sub_estados' | 'sub_vivos' | 'sub_momentos';
```

### State change in `StoriesScreen`

**Find** (inside `StoriesScreen`, line ~618):
```typescript
const [activeTab,    setActiveTab]    = useState<StoryTab>('estados');
```

**Replace with**:
```typescript
const [activeTab,    setActiveTab]    = useState<StoryTab>('estados');
const [activeSubTab, setActiveSubTab] = useState<EstadoSubTab>('sub_estados');
```

Also **remove** the `displayedGroups` line that references `streaming`/`momentos`:
**Find** (line ~637):
```typescript
const displayedGroups = activeTab === 'estados' ? recentGroups : seenGroups;
```
**Replace with** (keep it but it will only be used inside sub_estados now):
```typescript
const displayedGroups = recentGroups;
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 2 — Replace the top tab bar in `stories.tsx` (2 tabs instead of 4)

### What to do
Replace the 4-tab row with a 2-tab row ("Estados" | "Canales Dulce").
Below it, when `activeTab === 'estados'`, render a second sub-tab bar.

### Exact change

**Find** the entire `{/* TABS */}` block (lines ~1377–1402):
```tsx
      {/* TABS */}
      <View style={[st.tabsWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {([
          { id: 'estados'   as StoryTab, label: 'Estados'  },
          { id: 'streaming' as StoryTab, label: 'Vivos'    },
          { id: 'canales'   as StoryTab, label: 'Canales Dulce' },
          { id: 'momentos'  as StoryTab, label: 'Momentos' },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[st.tab, activeTab === t.id && st.tabActive]}
            onPress={() => {
              setActiveTab(t.id);
              if (t.id === 'momentos' && momentPosts.length === 0) loadMoments();
            }}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === t.id }}
          >
            <Text style={[st.tabText, { color: C.textTertiary }, activeTab === t.id && { color: C.textPrimary, fontWeight: '700' }]}>
              {t.label}
            </Text>
            {activeTab === t.id && <View style={[st.tabIndicator, { backgroundColor: BRAND }]} />}
          </TouchableOpacity>
        ))}
      </View>
```

**Replace with**:
```tsx
      {/* TABS — 2 pestañas principales */}
      <View style={[st.tabsWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {([
          { id: 'estados' as StoryTab, label: 'Estados' },
          { id: 'canales' as StoryTab, label: 'Canales Dulce' },
        ]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[st.tab, activeTab === t.id && st.tabActive]}
            onPress={() => setActiveTab(t.id)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === t.id }}
          >
            <Text style={[st.tabText, { color: C.textTertiary }, activeTab === t.id && { color: C.textPrimary, fontWeight: '700' }]}>
              {t.label}
            </Text>
            {activeTab === t.id && <View style={[st.tabIndicator, { backgroundColor: BRAND }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* SUB-TABS — solo visible cuando activeTab === 'estados' */}
      {activeTab === 'estados' && (
        <View style={[st.subTabsWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          {([
            { id: 'sub_estados'  as EstadoSubTab, label: 'Estados'  },
            { id: 'sub_vivos'    as EstadoSubTab, label: 'Vivos'    },
            { id: 'sub_momentos' as EstadoSubTab, label: 'Momentos' },
          ]).map(t => (
            <TouchableOpacity
              key={t.id}
              style={[st.tab, activeSubTab === t.id && st.tabActive]}
              onPress={() => {
                setActiveSubTab(t.id);
                if (t.id === 'sub_momentos' && momentPosts.length === 0) loadMoments();
              }}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSubTab === t.id }}
            >
              <Text style={[st.tabText, { color: C.textTertiary }, activeSubTab === t.id && { color: C.textPrimary, fontWeight: '700' }]}>
                {t.label}
              </Text>
              {activeSubTab === t.id && <View style={[st.tabIndicator, { backgroundColor: BRAND }]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
```

Add this style to the `st` StyleSheet (after `tabsWrap`):
```typescript
  subTabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 8, paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 3 — Update header actions in `stories.tsx` (conditional on sub-tab)

### What to do
The header currently shows galeria/camara when `activeTab === 'estados'` and camera/add when `activeTab === 'momentos'`. Change to sub-tab logic.

### Exact change

**Find** (inside the `{/* HEADER */}` block, the `{/* headerActions */}` section):
```tsx
        <View style={st.headerActions}>
          {activeTab === 'estados' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={pickFromGallery} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Galeria">
                <MIcon name="image" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={addStory} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo estado">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'momentos' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={() => setShowMomentCamera(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Camara momentos">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo momento">
                <MIcon name="add" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
```

**Replace with**:
```tsx
        <View style={st.headerActions}>
          {activeTab === 'estados' && activeSubTab === 'sub_estados' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={pickFromGallery} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Galeria">
                <MIcon name="image" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={addStory} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo estado">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          {activeTab === 'estados' && activeSubTab === 'sub_vivos' && (
            <TouchableOpacity style={st.headerBtn} onPress={() => setShowLive(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Iniciar directo">
              <MIcon name="fiber-manual-record" size={21} color="#fff" />
            </TouchableOpacity>
          )}
          {activeTab === 'estados' && activeSubTab === 'sub_momentos' && (
            <>
              <TouchableOpacity style={st.headerBtn} onPress={() => setShowMomentCamera(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Camara momentos">
                <MIcon name="photo-camera" size={21} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.headerBtn} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Nuevo momento">
                <MIcon name="add" size={21} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 4 — Replace the 4 TAB content blocks with 2 main + 3 sub-tab blocks in `stories.tsx`

### What to do
Remove the `{activeTab === 'estados'}`, `{activeTab === 'streaming'}`, `{activeTab === 'momentos'}` render blocks and replace with sub-tab routing.
Keep `{activeTab === 'canales'}` as-is.

### Exact change

**Find** the block (line ~1447 through ~1625, encompasses all 4 tab content blocks):
```tsx
      {/* ── TAB: ESTADOS ─────────────────────────────────────── */}
      {activeTab === 'estados' && (
        ...
      )}

      {/* ── TAB: STREAMINGS / VIVOS ───────────────────────────── */}
      {activeTab === 'streaming' && (
        ...
      )}

      {/* ── TAB: CANALES DULCE ───────────────────────────────── */}
      {activeTab === 'canales' && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bgPrimary }} showsVerticalScrollIndicator={false}>
          <CanalesDulceTab />
        </ScrollView>
      )}

      {/* ── TAB: MOMENTOS ────────────────────────────────────── */}
      {activeTab === 'momentos' && (
        ...
      )}
```

**Replace with the following** (preserve every existing JSX inside each block verbatim; only restructure the conditionals and add `paddingBottom`):

```tsx
      {/* ── SUB-TAB: ESTADOS (dentro de la pestaña Estados) ─── */}
      {activeTab === 'estados' && activeSubTab === 'sub_estados' && (
        loading ? (
          <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, backgroundColor: C.bgPrimary }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            <StoriesCarousel />
            {recentGroups.length > 0 && (
              <View style={st.feedLabel}>
                <Text style={[st.feedLabelText, { color: C.textTertiary }]}>TODOS LOS ESTADOS</Text>
              </View>
            )}
            {recentGroups.length > 0 ? recentGroups.map(group => {
              const globalIdx = groups.findIndex(g => g.userId === group.userId);
              return (
                <StoryCard
                  key={group.userId}
                  group={group}
                  C={C}
                  onPress={() => setViewingGroup(myGroup ? globalIdx + 1 : globalIdx)}
                />
              );
            }) : (
              <View style={st.empty}>
                <MIcon name="auto-awesome" size={52} color={C.border} />
                <Text style={[st.emptyTitle, { color: C.textSecondary }]}>Todo al dia</Text>
                <Text style={[st.emptySub, { color: C.textTertiary }]}>No hay estados nuevos de tus contactos</Text>
                <TouchableOpacity style={st.emptyBtn} onPress={addStory} activeOpacity={0.85}>
                  <LinearGradient colors={[BRAND, BRAND2]} style={st.emptyBtnGrad}>
                    <MIcon name="add" size={18} color="#fff" />
                    <Text style={st.emptyBtnText}>Publicar estado</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )
      )}

      {/* ── SUB-TAB: VIVOS (dentro de la pestaña Estados) ─────── */}
      {activeTab === 'estados' && activeSubTab === 'sub_vivos' && (
        <ScrollView
          style={{ flex: 1, backgroundColor: C.bgPrimary }}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={[BRAND + '22', BRAND2 + '11']} style={st.liveBannerCard}>
            <View style={st.liveDotLarge} />
            <View style={{ flex: 1 }}>
              <Text style={[st.liveBannerTitle, { color: C.textPrimary }]}>Streamings en vivo</Text>
              <Text style={[st.liveBannerSub, { color: C.textSecondary }]}>Inicia o únete a un directo</Text>
            </View>
            <MIcon name="live-tv" size={32} color={BRAND} />
          </LinearGradient>
          <View style={st.liveEmpty}>
            <MIcon name="videocam" size={64} color={C.border} />
            <Text style={[st.emptyTitle, { color: C.textSecondary, marginTop: 16 }]}>Sin streams activos</Text>
            <Text style={[st.emptySub, { color: C.textTertiary, textAlign: 'center' }]}>
              Cuando alguien inicie un directo aparecerá aquí en tiempo real
            </Text>
            <TouchableOpacity
              style={[st.emptyBtn, { marginTop: 24 }]}
              onPress={() => setShowLive(true)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#ef4444', '#f97316']} style={st.emptyBtnGrad}>
                <MIcon name="fiber-manual-record" size={14} color="#fff" />
                <Text style={st.emptyBtnText}>Iniciar directo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── TAB: CANALES DULCE ───────────────────────────────── */}
      {activeTab === 'canales' && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bgPrimary }} showsVerticalScrollIndicator={false}>
          <CanalesDulceTab />
        </ScrollView>
      )}

      {/* ── SUB-TAB: MOMENTOS (dentro de la pestaña Estados) ─── */}
      {activeTab === 'estados' && activeSubTab === 'sub_momentos' && (
        momentLoading ? (
          <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : (
          <FlatList
            data={momentPosts}
            keyExtractor={p => p.id}
            style={{ flex: 1, backgroundColor: C.bgPrimary }}
            refreshControl={<RefreshControl refreshing={momentRefreshing} onRefresh={() => loadMoments(true)} colors={[BRAND]} tintColor={BRAND} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            ListEmptyComponent={
              <View style={st.empty}>
                <MIcon name="photo-camera" size={52} color={C.border} />
                <Text style={[st.emptyTitle, { color: C.textSecondary }]}>Sin momentos aun</Text>
                <Text style={[st.emptySub, { color: C.textTertiary }]}>Comparte un momento con tus contactos</Text>
                <TouchableOpacity style={st.emptyBtn} onPress={() => { pendingMediaRef.current = null; setShowMomentCreate(true); }} activeOpacity={0.85}>
                  <LinearGradient colors={[BRAND, BRAND2]} style={st.emptyBtnGrad}>
                    <MIcon name="add" size={18} color="#fff" />
                    <Text style={st.emptyBtnText}>Publicar momento</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              /* ── MOMENT POST CARD — same JSX as before; copy verbatim from the
                 old activeTab === 'momentos' renderItem. See Item 6 for video
                 rendering additions inside this card. ── */
              <MomentPostCard
                item={item}
                C={C}
                momentCurrentUid={momentCurrentUid}
                commentingPost={commentingPost}
                commentText={commentText}
                setCommentingPost={setCommentingPost}
                setCommentText={setCommentText}
                handleMomentLike={handleMomentLike}
                handleMomentComment={handleMomentComment}
                setMomentViewerPost={setMomentViewerPost}
                setMomentViewerImgIdx={setMomentViewerImgIdx}
                setMomentPosts={setMomentPosts}
              />
            )}
          />
        )
      )}
```

> **Note to coder**: To keep the render function clean, extract the moment-post card JSX (currently inline in the old `renderItem`) into a **new small component `MomentPostCard`** that receives props. This is cleaner and avoids a 200-line inline lambda. See Item 5 for its definition. Alternatively, keep it inline — both approaches work; choose the one matching existing style (current code uses inline lambdas throughout, so inline is fine).

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 5 — Add `MyStoriesManagerModal` to `stories.tsx`

### What to do
Add a new exported-but-local function component `MyStoriesManagerModal` after `MomentCreateModal`. It uses `myGroup?.stories` from the parent and is passed as a prop.

### State additions to `StoriesScreen`

Add these two state variables to `StoriesScreen`:
```typescript
const [showStoriesManager, setShowStoriesManager] = useState(false);
const [editingStoryCaption, setEditingStoryCaption] = useState<{ id: string; caption: string } | null>(null);
```

### Menu change: add "Gestionar mis estados" item

**Find** the `myStoryMenu` Modal content — the array passed to `.map(...)` that currently has 3 items (image, add-circle, visibility). Add a 4th item only when `myStories.length > 0`:

After the closing `})` of the existing `.map(...)` items array and before the separate `{myGroup?.storyId && myStories.length > 0 && ...}` block that renders the delete button, **add**:

```tsx
            {myStories.length > 0 && (
              <TouchableOpacity
                style={[st.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.borderLight }]}
                onPress={() => { setMyStoryMenu(false); setShowStoriesManager(true); }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Gestionar mis estados"
              >
                <View style={[st.menuIconWrap, { backgroundColor: BRAND2 + '22' }]}>
                  <MIcon name="edit" size={18} color={BRAND2} />
                </View>
                <Text style={[st.menuItemText, { color: C.textPrimary }]}>Gestionar mis estados</Text>
                <MIcon name="chevron-right" size={14} color={C.border} />
              </TouchableOpacity>
            )}
```

### Add `<MyStoriesManagerModal>` to the render tree

Just before `{/* VISOR DE STORIES */}`, add:
```tsx
      {/* MODAL GESTIONAR ESTADOS */}
      <MyStoriesManagerModal
        visible={showStoriesManager}
        stories={myStories}
        onClose={() => setShowStoriesManager(false)}
        onRefresh={loadStories}
        C={C}
        isDark={isDark}
      />
```

### Component definition

Place this component **after** `MomentCreateModal` and before `// ══ ESTILOS MOMENTOS`:

```tsx
// ══════════════════════════════════════════════════════════════════
// MODAL GESTIONAR MIS ESTADOS
// Lista los estados propios con edición de caption y borrado
// ══════════════════════════════════════════════════════════════════

interface MyStory {
  id: string;
  media_url?: string;
  caption?: string;
  created_at: string;
  type?: string;
  // Algunos backends devuelven array de medias
  media?: Array<{ url: string; type?: string }>;
  images?: string[];
}

interface MyStoriesManagerModalProps {
  visible: boolean;
  stories: MyStory[];
  onClose: () => void;
  onRefresh: () => void;
  C: typeof Colors;
  isDark: boolean;
}

function MyStoriesManagerModal({
  visible, stories, onClose, onRefresh, C, isDark,
}: MyStoriesManagerModalProps) {
  const insets = useSafeAreaInsets();
  const [editCaption, setEditCaption] = React.useState<{ id: string; caption: string } | null>(null);
  const [savingCaption, setSavingCaption] = React.useState(false);
  const [localStories, setLocalStories] = React.useState<MyStory[]>([]);

  // Sync localStories from props whenever modal opens
  React.useEffect(() => {
    if (visible) setLocalStories(stories);
  }, [visible, stories]);

  const handleSaveCaption = async () => {
    if (!editCaption) return;
    setSavingCaption(true);
    try {
      const token = await getToken();
      const BASE  = getApiBase();
      await fetch(`${BASE}/api/stories/${editCaption.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editCaption.caption }),
      });
      setLocalStories(prev => prev.map(s =>
        s.id === editCaption.id ? { ...s, caption: editCaption.caption } : s
      ));
      setEditCaption(null);
      onRefresh();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el texto');
    } finally {
      setSavingCaption(false);
    }
  };

  const handleDeleteStory = (storyId: string) => {
    Alert.alert(
      'Eliminar estado',
      '¿Eliminar este estado completo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await storiesAPI.delete(storyId);
              setLocalStories(prev => prev.filter(s => s.id !== storyId));
              onRefresh();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el estado');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMedia = (storyId: string, _mediaIndex: number) => {
    // storiesAPI.deleteMedia does not exist — fall back to full story deletion
    Alert.alert(
      'Eliminar estado',
      'No es posible eliminar solo este medio. ¿Deseas eliminar el estado completo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: () => handleDeleteStory(storyId),
        },
      ]
    );
  };

  const isVideo = (url?: string) =>
    !!url && /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPrimary }} edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, paddingTop: insets.top > 0 ? 10 : 16, gap: 10 }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
          >
            <MIcon name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' }}>Mis estados</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {localStories.length} {localStories.length === 1 ? 'estado' : 'estados'}
          </Text>
        </LinearGradient>

        {localStories.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name="auto-awesome" size={52} color={C.border} />
            <Text style={{ color: C.textSecondary, marginTop: 12, fontSize: 15, fontWeight: '600' }}>
              Sin estados publicados
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 32 }}
          >
            {localStories.map((story, _idx) => {
              // Multi-media: prefer story.media array, else story.images, else single media_url
              const mediaItems: Array<{ url: string; type?: string }> =
                story.media && story.media.length > 0
                  ? story.media
                  : story.images && story.images.length > 0
                    ? story.images.map(u => ({ url: u, type: 'image' }))
                    : story.media_url
                      ? [{ url: story.media_url, type: story.type || 'image' }]
                      : [];

              return (
                <View
                  key={story.id}
                  style={[mgst.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
                >
                  {/* Time */}
                  <Text style={[mgst.time, { color: C.textTertiary }]}>
                    {timeAgo(story.created_at)}
                  </Text>

                  {/* Media thumbnails */}
                  {mediaItems.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
                    >
                      {mediaItems.map((m, mIdx) => (
                        <View key={mIdx} style={mgst.thumbWrap}>
                          {isVideo(m.url) || m.type === 'video' ? (
                            <LinearGradient
                              colors={['#1a1a2e', '#16213e']}
                              style={mgst.thumb}
                            >
                              <MIcon name="play-circle-outline" size={28} color="rgba(255,255,255,0.7)" />
                            </LinearGradient>
                          ) : (
                            <Image
                              source={{ uri: m.url }}
                              style={mgst.thumb}
                              resizeMode="cover"
                            />
                          )}
                          {/* × button per media item */}
                          <TouchableOpacity
                            style={mgst.removeBtn}
                            onPress={() => handleDeleteMedia(story.id, mIdx)}
                          >
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 16 }}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Caption */}
                  {!!story.caption && (
                    <Text style={[mgst.caption, { color: C.textSecondary }]} numberOfLines={2}>
                      {story.caption}
                    </Text>
                  )}

                  {/* Actions row */}
                  <View style={mgst.actions}>
                    <TouchableOpacity
                      style={[mgst.actionBtn, { backgroundColor: BRAND2 + '18', borderColor: BRAND2 + '40' }]}
                      onPress={() => setEditCaption({ id: story.id, caption: story.caption || '' })}
                    >
                      <MIcon name="edit" size={14} color={BRAND2} />
                      <Text style={{ color: BRAND2, fontSize: 12, fontWeight: '700' }}>Editar texto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[mgst.actionBtn, { backgroundColor: '#ef444418', borderColor: '#ef444440' }]}
                      onPress={() => handleDeleteStory(story.id)}
                    >
                      <MIcon name="delete" size={14} color="#ef4444" />
                      <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Edit caption secondary modal */}
        <Modal
          visible={!!editCaption}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditCaption(null)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: C.bgPrimary }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <LinearGradient
              colors={['#00C8A0', '#00B4E6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, paddingTop: insets.top > 0 ? 10 : 16, gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setEditCaption(null)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
              >
                <MIcon name="close" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' }}>Editar texto</Text>
              <TouchableOpacity
                onPress={handleSaveCaption}
                disabled={savingCaption}
                style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }}
              >
                {savingCaption
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Guardar</Text>
                }
              </TouchableOpacity>
            </LinearGradient>
            <View style={{ padding: 16 }}>
              <TextInput
                style={{
                  fontSize: 16, minHeight: 120, textAlignVertical: 'top',
                  borderRadius: 10, borderWidth: 1, borderColor: C.borderLight,
                  padding: 12, lineHeight: 22, color: C.textPrimary,
                }}
                placeholder="Añade un texto a tu estado..."
                placeholderTextColor={C.textTertiary}
                value={editCaption?.caption ?? ''}
                onChangeText={v => setEditCaption(prev => prev ? { ...prev, caption: v } : prev)}
                multiline
                maxLength={300}
                autoFocus
              />
              <Text style={{ fontSize: 11, textAlign: 'right', marginTop: 4, color: C.textTertiary }}>
                {(editCaption?.caption ?? '').length}/300
              </Text>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
```

### Styles for `MyStoriesManagerModal`

Add the `mgst` StyleSheet after the `mps` StyleSheet:

```typescript
const mgst = StyleSheet.create({
  card:      { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 14 },
  time:      { fontSize: 11, fontWeight: '600', marginBottom: 10 },
  thumbWrap: { position: 'relative', width: 80, height: 80 },
  thumb:     { width: 80, height: 80, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  caption:   { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  actions:   { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 6 — Add video support to `MomentCreateModal` in `stories.tsx`

### Type change

**Find** in `stories.tsx` (line ~547):
```typescript
interface MomentPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  likes: number;
  liked_by_me: boolean;
  comments: MomentComment[];
  created_at: string;
}
```

**Replace with**:
```typescript
interface MomentPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  videos?: string[];      // ← NEW
  likes: number;
  liked_by_me: boolean;
  comments: MomentComment[];
  created_at: string;
}
```

### `createMomentPost` signature change

**Find**:
```typescript
async function createMomentPost(text: string, localImages: string[]): Promise<MomentPost | null> {
```

**Replace with**:
```typescript
async function createMomentPost(text: string, localImages: string[], localVideos: string[] = []): Promise<MomentPost | null> {
```

Inside the function, after the `uploadedImages` loop, **add** a similar loop for videos:

```typescript
    const uploadedVideos: string[] = [];
    for (const uri of localVideos) {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        uploadedVideos.push(uri);
      } else {
        const publicUrl = await uploadStoryMediaToSupabase(userId, uri, 'video');
        if (publicUrl) uploadedVideos.push(publicUrl);
      }
    }
```

Change the POST body from:
```typescript
      body: JSON.stringify({ text, images: uploadedImages }),
```
to:
```typescript
      body: JSON.stringify({ text, images: uploadedImages, videos: uploadedVideos }),
```

Change the fallback local object to include `videos`:
```typescript
  return {
    id: `local-${Date.now()}`,
    user_id: me?.id || 'local',
    user_name: me?.full_name || 'Yo',
    user_avatar: me?.avatar_url,
    text,
    images: localImages,
    videos: localVideos,
    likes: 0,
    liked_by_me: false,
    comments: [],
    created_at: new Date().toISOString(),
  };
```

### `MomentCreateModal` component changes

**Find** inside `MomentCreateModal`:
```typescript
  const [text, setText] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
```

**Replace with**:
```typescript
  const [text, setText] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [videos, setVideos] = React.useState<string[]>([]);    // ← NEW
  const [creating, setCreating] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
```

**Find** the `useEffect` that pre-populates from `pendingMedia` (currently reads `pendingMediaRef.current` via prop, but `MomentCreateModal` receives no `pendingMedia` prop — instead the parent just sets `pendingMediaRef.current` and opens the modal). The modal currently has no `pendingMedia` prop. We need to add it.

**Current prop interface** of `MomentCreateModal`:
```typescript
function MomentCreateModal({
  visible, onClose, onCreated, C, isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
  isDark: boolean;
})
```

**Replace with**:
```typescript
function MomentCreateModal({
  visible, onClose, onCreated, C, isDark, pendingMedia,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
  isDark: boolean;
  pendingMedia?: MomentMedia | null;   // ← NEW
})
```

**Add a `useEffect`** inside `MomentCreateModal` (after the existing state declarations):
```typescript
  // Pre-populate from camera/gallery
  React.useEffect(() => {
    if (visible && pendingMedia?.uri) {
      if (pendingMedia.type === 'video') {
        setVideos([pendingMedia.uri]);
        setImages([]);
      } else {
        setImages([pendingMedia.uri]);
        setVideos([]);
      }
    } else if (!visible) {
      setText('');
      setImages([]);
      setVideos([]);
    }
  }, [visible, pendingMedia]);
```

**Add `handlePickVideo`** function inside `MomentCreateModal` (after `handlePickImage`):
```typescript
  const handlePickVideo = async () => {
    const asset = await pickVideo().catch(() => null);
    if (asset?.uri) {
      setVideos(prev => [...prev, asset.uri].slice(0, 3)); // max 3 videos
    }
  };
```

Note: `pickVideo` is already imported in `stories.tsx` at the top level import line.

**Change `handleCreate`** inside `MomentCreateModal`:

Find:
```typescript
  const handleCreate = async () => {
    if (!text.trim() && images.length === 0) { Alert.alert('Escribe algo o añade una foto'); return; }
    setCreating(true);
    if (images.length > 0) setUploadingImages(true);
    try {
      const post = await createMomentPost(text.trim(), images);
      setUploadingImages(false);
      if (post) { onCreated(post); setText(''); setImages([]); }
    } finally { setCreating(false); setUploadingImages(false); }
  };
```

Replace with:
```typescript
  const handleCreate = async () => {
    if (!text.trim() && images.length === 0 && videos.length === 0) {
      Alert.alert('Escribe algo o añade una foto/video'); return;
    }
    setCreating(true);
    if (images.length > 0 || videos.length > 0) setUploadingImages(true);
    try {
      const post = await createMomentPost(text.trim(), images, videos);
      setUploadingImages(false);
      if (post) { onCreated(post); setText(''); setImages([]); setVideos([]); }
    } finally { setCreating(false); setUploadingImages(false); }
  };
```

**In the JSX of `MomentCreateModal`**, add video thumbnails and the "Añadir video" button.

Find the images section (inside `<ScrollView>`):
```tsx
          {images.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {images.map((uri, i) => (
                <View key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity
                  style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' }}
                  onPress={handlePickImage}
                >
                  <MIcon name="add" size={24} color={C.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, borderRadius: 10, padding: 16, marginTop: 8 }}
              onPress={handlePickImage}
            >
              <MIcon name="image" size={24} color={C.textTertiary} />
              <Text style={{ fontSize: 15, color: C.textTertiary }}>Anadir fotos</Text>
            </TouchableOpacity>
          )}
```

Replace with:
```tsx
          {/* Images */}
          {(images.length > 0 || videos.length > 0) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {images.map((uri, i) => (
                <View key={`img-${i}`} style={{ position: 'relative', width: 80, height: 80 }}>
                  <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {videos.map((uri, i) => (
                <View key={`vid-${i}`} style={{ position: 'relative', width: 80, height: 80 }}>
                  <LinearGradient colors={['#1a1a2e', '#16213e']} style={{ width: 80, height: 80, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <MIcon name="play-circle-outline" size={32} color="rgba(255,255,255,0.8)" />
                  </LinearGradient>
                  <TouchableOpacity
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setVideos(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity
                  style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, alignItems: 'center', justifyContent: 'center' }}
                  onPress={handlePickImage}
                >
                  <MIcon name="add" size={24} color={C.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, borderRadius: 10, padding: 16 }}
                onPress={handlePickImage}
              >
                <MIcon name="image" size={24} color={C.textTertiary} />
                <Text style={{ fontSize: 15, color: C.textTertiary }}>Añadir fotos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.borderLight, borderRadius: 10, padding: 16 }}
                onPress={handlePickVideo}
              >
                <MIcon name="videocam" size={24} color={C.textTertiary} />
                <Text style={{ fontSize: 15, color: C.textTertiary }}>Añadir video</Text>
              </TouchableOpacity>
            </View>
          )}
```

### Pass `pendingMedia` prop at call site

**Find** in `StoriesScreen` render:
```tsx
      <MomentCreateModal
        visible={showMomentCreate}
        onClose={() => setShowMomentCreate(false)}
        onCreated={(post) => { setMomentPosts(prev => [post, ...prev]); setShowMomentCreate(false); }}
        C={C}
        isDark={isDark}
      />
```

**Replace with**:
```tsx
      <MomentCreateModal
        visible={showMomentCreate}
        onClose={() => { setShowMomentCreate(false); pendingMediaRef.current = null; }}
        onCreated={(post) => { setMomentPosts(prev => [post, ...prev]); setShowMomentCreate(false); pendingMediaRef.current = null; }}
        C={C}
        isDark={isDark}
        pendingMedia={pendingMediaRef.current}
      />
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 7 — Fix `handleMomentCameraDone` for video routing in `stories.tsx`

### What to do
The current handler always sets `pendingMediaRef.current` with the media (already correct). The issue is downstream: `MomentCreateModal` doesn't receive the ref and doesn't check `type`. After Item 6 fixes the prop passing and type check, this handler needs no structural change. However, verify it sets the type correctly:

**Current code** (already correct, but annotate):
```typescript
  const handleMomentCameraDone = useCallback(async (media: MomentMedia) => {
    setShowMomentCamera(false);
    let publicUrl = media.uri;
    if (!media.uri.startsWith('http')) {
      const uploaded = await uploadStoryMediaToSupabase(meId || 'unknown', media.uri, media.type === 'video' ? 'video' : 'image');
      if (uploaded) publicUrl = uploaded;
    }
    pendingMediaRef.current = { ...media, uri: publicUrl };
    setShowMomentCreate(true);
  }, [meId]);
```

This is **already correct** — it preserves `media.type` in `pendingMediaRef.current`. After Item 6, `MomentCreateModal` will read `pendingMedia.type` and route to `videos` or `images` accordingly. **No change needed here.**

### Files: `egchat-mobile/app/stories.tsx` — no change needed, verify only.

---

## Item 8 — Add video rendering in the `sub_momentos` FlatList render in `stories.tsx`

### What to do
In the `renderItem` for moment posts (inside the `sub_momentos` FlatList), after the images grid, add video rendering.

### Where to apply
In the moment post card renderItem (currently inline JSX or new `MomentPostCard` component), after:
```tsx
                {item.images && item.images.length > 0 && (
                  <View style={mps.imagesGrid}>
                    {/* ...image thumbnails... */}
                  </View>
                )}
```

**Add**:
```tsx
                {/* Videos */}
                {item.videos && item.videos.length > 0 && (
                  <View style={{ gap: 8, marginBottom: 10 }}>
                    {item.videos.map((vUri, vi) => (
                      <Video
                        key={vi}
                        source={{ uri: vUri }}
                        style={{ width: '100%', height: 220, borderRadius: 10 }}
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls
                        isLooping={false}
                      />
                    ))}
                  </View>
                )}
```

### Files: `egchat-mobile/app/stories.tsx`

---

## Item 9 — `moments.tsx`: Add `videos` to `MomentPost`, `createMoment`, `CreatePostModal`

### Type change

**Find** in `moments.tsx`:
```typescript
interface MomentPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  likes: number;
  liked_by_me: boolean;
  comments: MomentComment[];
  created_at: string;
}
```

**Replace with**:
```typescript
interface MomentPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text?: string;
  images?: string[];
  videos?: string[];    // ← NEW
  likes: number;
  liked_by_me: boolean;
  comments: MomentComment[];
  created_at: string;
}
```

### `createMoment` function change

**Find**:
```typescript
async function createMoment(text: string, images: string[]): Promise<MomentPost | null> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/moments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
    });
    if (res.ok) return res.json();
  } catch {}
  // Fallback local
  const me = await authAPI.me().catch(() => null);
  const local: MomentPost = {
    id: `local-${Date.now()}`,
    user_id: me?.id || 'local',
    user_name: me?.full_name || 'Yo',
    user_avatar: me?.avatar_url,
    text,
    images,
    likes: 0,
    liked_by_me: false,
    comments: [],
    created_at: new Date().toISOString(),
  };
  return local;
}
```

**Replace with**:
```typescript
async function createMoment(text: string, images: string[], videos: string[] = []): Promise<MomentPost | null> {
  try {
    const BASE = getApiBase();
    const token = await getToken();

    // Upload local video URIs to Supabase Storage
    const uploadedVideos: string[] = [];
    for (const uri of videos) {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        uploadedVideos.push(uri);
      } else {
        const me = await authAPI.me().catch(() => null);
        const publicUrl = await uploadStoryMediaToSupabase(me?.id || 'anon', uri, 'video');
        if (publicUrl) uploadedVideos.push(publicUrl);
      }
    }

    const res = await fetch(`${BASE}/api/moments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images, videos: uploadedVideos }),
    });
    if (res.ok) return res.json();
  } catch {}
  // Fallback local
  const me = await authAPI.me().catch(() => null);
  const local: MomentPost = {
    id: `local-${Date.now()}`,
    user_id: me?.id || 'local',
    user_name: me?.full_name || 'Yo',
    user_avatar: me?.avatar_url,
    text,
    images,
    videos,
    likes: 0,
    liked_by_me: false,
    comments: [],
    created_at: new Date().toISOString(),
  };
  return local;
}
```

Also add the `uploadStoryMediaToSupabase` import — check existing imports in `moments.tsx`:
Already imported: `import { uploadStoryMediaToSupabase } from '../src/utils/storyMediaStorage';` ✅

Also add `pickVideo` import. **Find** in `moments.tsx`:
```typescript
import { getToken, getApiBase, authAPI } from '../src/api';
```
This is fine. Now check if `pickVideo` is imported. It is **NOT** currently imported in `moments.tsx`. Add to imports:

**Find**:
```typescript
import MomentCameraEditor, { type MomentMedia } from '../src/components/MomentCameraEditor';
```

**Replace with**:
```typescript
import MomentCameraEditor, { type MomentMedia } from '../src/components/MomentCameraEditor';
import { pickVideo } from '../src/utils/chatMedia';
```

Also add `Video` and `ResizeMode` from `expo-av`. Check existing imports in `moments.tsx` — they are **NOT** there. Add:

**Find** in `moments.tsx`:
```typescript
import { LinearGradient } from 'expo-linear-gradient';
```

**Replace with**:
```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
```

### `CreatePostModal` in `moments.tsx`

**Find** `CreatePostModal` props interface and state:
```typescript
function CreatePostModal({
  visible, onClose, onCreated, C, pendingMedia,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
  pendingMedia?: MomentMedia | null;
}) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();

  // Precargar imagen que viene de la cámara
  React.useEffect(() => {
    if (visible && pendingMedia?.uri) {
      setImages([pendingMedia.uri]);
    } else if (!visible) {
      setText('');
      setImages([]);
    }
  }, [visible, pendingMedia]);
```

**Replace with**:
```typescript
function CreatePostModal({
  visible, onClose, onCreated, C, pendingMedia,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (p: MomentPost) => void;
  C: typeof Colors;
  pendingMedia?: MomentMedia | null;
}) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);    // ← NEW
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();

  // Precargar media que viene de la cámara — distinguir foto de video
  React.useEffect(() => {
    if (visible && pendingMedia?.uri) {
      if (pendingMedia.type === 'video') {
        setVideos([pendingMedia.uri]);
        setImages([]);
      } else {
        setImages([pendingMedia.uri]);
        setVideos([]);
      }
    } else if (!visible) {
      setText('');
      setImages([]);
      setVideos([]);
    }
  }, [visible, pendingMedia]);
```

**Add `handlePickVideo`** in `CreatePostModal` (after `handlePickImage`):
```typescript
  const handlePickVideo = async () => {
    const asset = await pickVideo().catch(() => null);
    if (asset?.uri) {
      setVideos(prev => [...prev, asset.uri].slice(0, 3));
    }
  };
```

**Change `handleCreate`** in `CreatePostModal`:

Find:
```typescript
  const handleCreate = async () => {
    if (!text.trim() && images.length === 0) { toast.error('Escribe algo o añade una foto'); return; }
    setCreating(true);
    try {
      const post = await createMoment(text.trim(), images);
```

Replace:
```typescript
  const handleCreate = async () => {
    if (!text.trim() && images.length === 0 && videos.length === 0) {
      toast.error('Escribe algo o añade una foto/video'); return;
    }
    setCreating(true);
    try {
      const post = await createMoment(text.trim(), images, videos);
```

Also find the reset inside the success path:
```typescript
        toast.success('¡Moment publicado! 🎉');
```
After this line, ensure `setVideos([])` is called alongside `setImages([])` — look for the full reset in the existing success callback and add `setVideos([])`.

**In the JSX of `CreatePostModal`**, replace the images section the same way as Item 6.

Find the images section that currently has:
```tsx
          {/* Imágenes seleccionadas */}
          {images.length > 0 && (
            <View style={cm.imagesRow}>
              {images.map((uri, i) => (
                <View key={i} style={cm.imageThumb}>
                  <Image source={{ uri }} style={cm.thumbImg} />
                  <TouchableOpacity style={cm.removeImg} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity style={[cm.addImgBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
                  <Text style={{ fontSize: 24, color: C.textTertiary }}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {images.length === 0 && (
            <TouchableOpacity style={[cm.addPhotoBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
                <Polyline points="4 17 10 11 13 14 17 10 21 14"/><Polyline points="21 4 12 4 12 10"/><Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              </Svg>
              <Text style={[cm.addPhotoText, { color: C.textTertiary }]}>Añadir fotos</Text>
            </TouchableOpacity>
          )}
```

Replace with:
```tsx
          {/* Imágenes y videos seleccionados */}
          {(images.length > 0 || videos.length > 0) && (
            <View style={cm.imagesRow}>
              {images.map((uri, i) => (
                <View key={`img-${i}`} style={cm.imageThumb}>
                  <Image source={{ uri }} style={cm.thumbImg} />
                  <TouchableOpacity style={cm.removeImg} onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {videos.map((uri, i) => (
                <View key={`vid-${i}`} style={cm.imageThumb}>
                  <LinearGradient colors={['#1a1a2e', '#16213e']} style={[cm.thumbImg, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={2} strokeLinecap="round">
                      <Polyline points="5 3 19 12 5 21 5 3"/>
                    </Svg>
                  </LinearGradient>
                  <TouchableOpacity style={cm.removeImg} onPress={() => setVideos(prev => prev.filter((_, j) => j !== i))}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 9 && (
                <TouchableOpacity style={[cm.addImgBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
                  <Text style={{ fontSize: 24, color: C.textTertiary }}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {images.length === 0 && videos.length === 0 && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity style={[cm.addPhotoBtn, { borderColor: C.borderLight }]} onPress={handlePickImage}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
                  <Polyline points="4 17 10 11 13 14 17 10 21 14"/><Polyline points="21 4 12 4 12 10"/><Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                </Svg>
                <Text style={[cm.addPhotoText, { color: C.textTertiary }]}>Añadir fotos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[cm.addPhotoBtn, { borderColor: C.borderLight }]} onPress={handlePickVideo}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 7l-7 5 7 5V7z"/><Rect x="1" y="5" width="15" height="14" rx="2"/>
                </Svg>
                <Text style={[cm.addPhotoText, { color: C.textTertiary }]}>Añadir video</Text>
              </TouchableOpacity>
            </View>
          )}
```

### Video rendering in `renderPost` in `moments.tsx`

In `renderPost`, after the images grid block, add:
```tsx
      {/* Videos */}
      {item.videos && item.videos.length > 0 && (
        <View style={{ gap: 8, marginBottom: 10 }}>
          {item.videos.map((vUri, vi) => (
            <Video
              key={vi}
              source={{ uri: vUri }}
              style={{ width: '100%', height: 220, borderRadius: 10 }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              isLooping={false}
            />
          ))}
        </View>
      )}
```

### Files: `egchat-mobile/app/moments.tsx`

---

## Item 10 — Fix `handleCameraDone` in `moments.tsx` for video type routing

**Find** in `moments.tsx`:
```typescript
  const handleCameraDone = useCallback(async (media: MomentMedia) => {
    setShowCamera(false);
    // Subir la imagen/video a Supabase Storage para tener URL pública
    let publicUrl = media.uri;
    if (!media.uri.startsWith('http://') && !media.uri.startsWith('https://')) {
      const uploaded = await uploadStoryMediaToSupabase(
        currentUserId || 'unknown',
        media.uri,
        media.type === 'video' ? 'video' : 'image',
      );
      if (uploaded) publicUrl = uploaded;
    }
    // Abrir modal de texto con la imagen ya lista
    setShowCreate(true);
    // Guardamos la URL en un ref para que CreatePostModal la use como imagen precargada
    pendingMediaRef.current = { ...media, uri: publicUrl };
  }, [currentUserId]);
```

This is **already correct** — it preserves `media.type`. After Item 9 fixes `CreatePostModal`'s `useEffect` to check `pendingMedia.type`, the video routing will work. **No change needed here.**

### Files: `egchat-mobile/app/moments.tsx` — verify only.

---

## Item 11 — iPhone bar / safe area paddingBottom verification

The brief specifies the bottom edge is already handled. Verify these things are correct after the refactor:

1. The `sub_momentos` FlatList uses `contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}` ✅ (set in Item 4)
2. The `sub_vivos` ScrollView uses `contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}` ✅ (set in Item 4)
3. The `sub_estados` ScrollView uses `contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}` ✅ (set in Item 4)
4. The `canales` tab remains as ScrollView wrapping `CanalesDulceTab`, which has its own `paddingBottom: 60` inside the inner FlatList — this is fine.
5. Root `SafeAreaView` keeps `edges={['left', 'right', 'bottom']}` — **do NOT add `'top'`**.

---

## Summary of TypeScript type changes

| File | Type | Change |
|---|---|---|
| `stories.tsx` | `StoryTab` | `'estados' \| 'canales'` (was 4 variants) |
| `stories.tsx` | `EstadoSubTab` | NEW: `'sub_estados' \| 'sub_vivos' \| 'sub_momentos'` |
| `stories.tsx` | `MomentPost` | add `videos?: string[]` |
| `stories.tsx` | `MyStory` | NEW interface for manager modal |
| `stories.tsx` | `MyStoriesManagerModalProps` | NEW interface |
| `moments.tsx` | `MomentPost` | add `videos?: string[]` |

---

## Summary of new/changed functions

| File | Function | Change |
|---|---|---|
| `stories.tsx` | `createMomentPost` | add `localVideos: string[] = []` param, upload + POST |
| `stories.tsx` | `MomentCreateModal` | add `videos` state, `handlePickVideo`, type-aware useEffect, `pendingMedia` prop |
| `stories.tsx` | `MyStoriesManagerModal` | NEW component |
| `moments.tsx` | `createMoment` | add `videos: string[] = []` param, upload + POST |
| `moments.tsx` | `CreatePostModal` | add `videos` state, `handlePickVideo`, type-aware useEffect |

---

## Functions left untouched

- `StoryViewer` — no changes
- `StoryBubble`, `StoryCard`, `StoriesCarousel`, `MyBubble` — no changes
- `CanalesDulceTab` — no changes
- `LiveStreamModal` — no changes
- `handleMomentCameraDone` (stories.tsx) — no changes (already correct)
- `handleCameraDone` (moments.tsx) — no changes (already correct)
- `uploadStory`, `deleteStory`, `pickFromGallery`, `addStory`, `createTextStatus` — no changes
- All `StyleSheet` blocks except additions noted above — no changes
- `storiesAPI` — no changes (no `deleteMedia` exists; fall back to `delete`)

---

## Verification

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile
npx expo start --web
```

TypeScript errors will surface immediately in the terminal. Fix any reported type errors before considering the implementation complete. Key things to verify:
1. No TS error on `EstadoSubTab` usage (all 3 sub-tab IDs match the type).
2. `MomentCreateModal` receives `pendingMedia` prop without TS error.
3. `MyStoriesManagerModal` compiles with the `MyStory` interface.
4. `videos` field compiles on `MomentPost` in both files.
5. `pickVideo` import resolves in both files (already in stories.tsx imports; needs adding in moments.tsx).
6. `Video` and `ResizeMode` from `expo-av` compile in `moments.tsx` (expo-av is already a dependency).
