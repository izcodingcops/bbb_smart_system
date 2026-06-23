//
//  LocationStore.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import CoreData

final class LocationStore {
  
  // MARK: - Container
  
  private lazy var persistentContainer: NSPersistentContainer = {
    let container = NSPersistentContainer(name: "BBBDataModel")
    container.loadPersistentStores { _, error in
      if let error { fatalError("[CoreData] Failed to load store: \(error)") }
    }
    return container
  }()
  
  private var context: NSManagedObjectContext { persistentContainer.viewContext }
  
  // MARK: - Reads
  
  func count() -> Int {
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "CubeLocation")
    return (try? context.count(for: req)) ?? 0
  }
  
  func nextBatch(limit: Int = 400) -> [CubeLocation] {
    let req: NSFetchRequest<CubeLocation> = CubeLocation.fetchRequest()
    // Oldest-first. ctimestamp is a fixed-width ms-epoch string, so an ascending
    // string sort == chronological. The smoother assumes chronological order and
    // this makes upload draining FIFO.
    req.sortDescriptors = [NSSortDescriptor(key: "ctimestamp", ascending: true)]
    req.fetchLimit = limit
    return (try? context.fetch(req)) ?? []
  }
  
  func allAsDicts(timestampToDate: (String?) -> String?) -> [[String: String]] {
    let req: NSFetchRequest<CubeLocation> = CubeLocation.fetchRequest()
    req.sortDescriptors = [NSSortDescriptor(key: "ctimestamp", ascending: true)]
    let results = (try? context.fetch(req)) ?? []
    return results.map { loc in [
      "latitude": loc.clatitude ?? "",
      "longitude": loc.clongitute ?? "",
      "log_created_date": timestampToDate(loc.ctimestamp) ?? "",
      "timestamp": loc.ctimestamp ?? "",
    ]}
  }
  
  // MARK: - Writes
  
  func insert(latitude: String, longitude: String, accuracy: String, online: Bool) {
    guard let entity = NSEntityDescription.entity(forEntityName: "CubeLocation", in: context),
          let loc = NSManagedObject(entity: entity, insertInto: context) as? CubeLocation
    else { return }
    loc.clatitude = latitude
    loc.clongitute = longitude
    loc.ctimestamp = "\(Int(Date().timeIntervalSince1970 * 1000))"
    loc.onlineOrOffline = online ? "online" : "offline"
    loc.chorizontalAccuracy = accuracy
    try? context.save()
  }
  
  // MARK: - Deletes
  
  func delete(timestamps: [String]) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let req = NSFetchRequest<NSFetchRequestResult>(entityName: "CubeLocation")
      req.predicate = NSPredicate(format: "ctimestamp IN %@", timestamps)
      let delete = NSBatchDeleteRequest(fetchRequest: req)
      try? self.context.execute(delete)
      self.context.reset()
    }
  }
  
  func deleteAll() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let req = NSFetchRequest<NSFetchRequestResult>(entityName: "CubeLocation")
      let delete = NSBatchDeleteRequest(fetchRequest: req)
      try? self.context.execute(delete)
      self.context.reset()
    }
  }
}

extension CubeLocation {
  @nonobjc class func fetchRequest() -> NSFetchRequest<CubeLocation> {
    return NSFetchRequest<CubeLocation>(entityName: "CubeLocation")
  }
}
