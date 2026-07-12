import SwiftUI

struct CityPickerView: View {
    @Environment(\.dismiss) private var dismiss
    let currentCityName: String
    let onSelect: (City) -> Void

    @State private var searchText = ""

    private var filteredGroups: [CountryGroup] {
        let query = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        if query.isEmpty { return CountryGroup.all }
        return CountryGroup.all.compactMap { group in
            let filtered = group.cities.filter {
                $0.nameAr.contains(query) ||
                $0.name.lowercased().contains(query) ||
                group.countryAr.contains(query) ||
                group.country.lowercased().contains(query)
            }
            return filtered.isEmpty ? nil : CountryGroup(country: group.country, countryAr: group.countryAr, cities: filtered)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppColors.bg.ignoresSafeArea()

                VStack(spacing: 0) {
                    HStack {
                        HStack(spacing: 8) {
                            Image(systemName: "magnifyingglass")
                                .foregroundStyle(AppColors.textMuted)
                            TextField("ابحث عن مدينة أو دولة...", text: $searchText)
                                .font(.dubai(15, weight: .regular))
                                .foregroundStyle(AppColors.text)
                                .multilineTextAlignment(.trailing)
                                .frame(minHeight: 44)
                        }
                        .padding(.horizontal, 14)
                        .background(AppColors.card)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(AppColors.cardBorder, lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                    if filteredGroups.isEmpty {
                        Spacer()
                        Text("لا توجد نتائج")
                            .font(.dubai(16, weight: .medium))
                            .foregroundStyle(AppColors.textMuted)
                        Spacer()
                    } else {
                        List {
                            ForEach(filteredGroups) { group in
                                Section {
                                    ForEach(group.cities) { city in
                                        cityRow(city: city)
                                    }
                                } header: {
                                    HStack {
                                        Text(group.countryAr)
                                            .font(.dubai(14, weight: .bold))
                                            .foregroundStyle(AppColors.accent)
                                        Rectangle()
                                            .fill(AppColors.separator)
                                            .frame(height: 1)
                                    }
                                    .textCase(nil)
                                }
                                .listRowBackground(AppColors.bg)
                            }
                        }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("اختيار المدينة")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("إغلاق") {
                        dismiss()
                    }
                    .font(.dubai(16, weight: .medium))
                    .foregroundStyle(AppColors.textSecondary)
                }
            }
        }
    }

    private func cityRow(city: City) -> some View {
        let selected = currentCityName == city.nameAr
        return Button {
            onSelect(city)
            dismiss()
        } label: {
            HStack {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(city.nameAr)
                        .font(.dubai(15, weight: .medium))
                        .foregroundStyle(selected ? AppColors.accent : AppColors.text)
                    Text(city.name)
                        .font(.dubai(12, weight: .regular))
                        .foregroundStyle(AppColors.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .trailing)

                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(AppColors.accent)
                        .frame(width: 28, height: 28)
                        .background(AppColors.accentDim)
                        .clipShape(Circle())
                }
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(selected ? AppColors.accentDim : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }
}
