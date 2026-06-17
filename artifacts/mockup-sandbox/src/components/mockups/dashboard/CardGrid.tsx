export function CardGrid() {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex font-sans">
      {/* Narrow icon-only sidebar */}
      <aside className="w-16 bg-[#1a3a3a] flex flex-col items-center py-5 gap-5 shrink-0">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-2">
          <span className="text-white text-sm font-bold">L</span>
        </div>
        {[
          { icon: "⊞", active: true },
          { icon: "◎" },
          { icon: "✎" },
          { icon: "☰" },
          { icon: "+" },
        ].map((item, i) => (
          <button
            key={i}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
              item.active ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon}
          </button>
        ))}
        <div className="mt-auto w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-sm font-bold text-amber-900">T</div>
      </aside>

      {/* Main grid content */}
      <main className="flex-1 p-7 overflow-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-serif font-bold text-[#1a3a3a]">Tổng quan</h1>
          <p className="text-[#607080] text-sm">Thứ Hai, 16 tháng 6, 2025</p>
        </div>

        {/* Masonry-style card grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Big hero card — spans 2 cols */}
          <div className="col-span-2 bg-[#1a3a3a] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Từ trong ngày</div>
            <div className="text-3xl font-serif font-bold mb-1">ephemeral</div>
            <div className="text-white/60 text-sm mb-4">/ɪˈfem.ər.əl/ · tính từ · Khó</div>
            <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-white/80 mb-4">
              "Chỉ tồn tại trong thời gian ngắn; thoáng qua"
            </div>
            <button className="bg-white text-[#1a3a3a] font-semibold text-sm px-5 py-2 rounded-lg">
              Học từ này →
            </button>
          </div>

          {/* Streak card */}
          <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-5 text-white flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/80">Chuỗi học</div>
            <div className="text-center py-2">
              <div className="text-5xl font-serif font-bold">7</div>
              <div className="text-white/80 text-sm mt-1">ngày liên tiếp 🔥</div>
            </div>
            <div className="flex gap-1">
              {["T2","T3","T4","T5","T6","T7","CN"].map((d, i) => (
                <div key={d} className={`flex-1 h-1.5 rounded-full ${i < 5 ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
          </div>

          {/* Review queue */}
          <div className="bg-white rounded-2xl p-5 border border-[#e0e8f0]">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#8090a0] mb-3">Hàng chờ ôn tập</div>
            <div className="text-4xl font-serif font-bold text-[#1a3a3a]">12</div>
            <div className="text-sm text-[#607080] mt-1 mb-4">từ cần ôn hôm nay</div>
            <button className="w-full bg-[#1a3a3a] text-white rounded-xl py-2.5 text-sm font-medium">
              Ôn tập →
            </button>
          </div>

          {/* Mastered */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600/60 mb-3">Đã thành thạo</div>
            <div className="text-4xl font-serif font-bold text-emerald-700">24</div>
            <div className="text-sm text-emerald-600/70 mt-1">trong tổng 158 từ</div>
            <div className="mt-3 h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "15%" }} />
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 flex flex-col justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-purple-600/60">Độ chính xác</div>
            <div className="text-4xl font-serif font-bold text-purple-700 mt-2">82%</div>
            <div className="text-sm text-purple-500/70">trung bình các lần kiểm tra</div>
          </div>
        </div>
      </main>
    </div>
  );
}
