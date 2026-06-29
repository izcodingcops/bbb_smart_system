//
//  LocationPersistenceStore.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import CoreData

final class LocationPersistenceStore {
  
  // MARK: - Container
  
  private lazy var persistentContainer: NSPersistentContainer = {
    let container = NSPersistentContainer(name: "LocationDataModel")
    container.loadPersistentStores { _, error in
      if let error { fatalError("[CoreData] Failed to load store: \(error)") }
    }
    return container
  }()
  
  private var context: NSManagedObjectContext { persistentContainer.viewContext }
  
  // MARK: - Reads
  
  func count() -> Int {
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
    return (try? context.count(for: req)) ?? 0
  }
  
  func nextBatch(limit: Int = 400) -> [StoredLocation] {
    let req: NSFetchRequest<StoredLocation> = StoredLocation.fetchRequest()
    // Oldest-first. ctimestamp is a fixed-width ms-epoch string, so an ascending
    // string sort == chronological. The smoother assumes chronological order and
    // this makes upload draining FIFO.
    req.sortDescriptors = [NSSortDescriptor(key: "ctimestamp", ascending: true)]
    req.fetchLimit = limit
    return (try? context.fetch(req)) ?? []
  }
  
  func allAsDicts(timestampToDate: (String?) -> String?) -> [[String: String]] {
    let req: NSFetchRequest<StoredLocation> = StoredLocation.fetchRequest()
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
    guard let entity = NSEntityDescription.entity(forEntityName: "StoredLocation", in: context),
          let loc = NSManagedObject(entity: entity, insertInto: context) as? StoredLocation
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
    context.performAndWait {
      let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
      req.predicate = NSPredicate(format: "ctimestamp IN %@", timestamps)
      let batchDelete = NSBatchDeleteRequest(fetchRequest: req)
      batchDelete.resultType = .resultTypeObjectIDs
      // Merge only the deleted object IDs back into the context rather than
      // calling context.reset(), which would discard any pending inserts from
      // concurrent location updates.
      if let result = try? context.execute(batchDelete) as? NSBatchDeleteResult,
         let ids = result.result as? [NSManagedObjectID] {
        NSManagedObjectContext.mergeChanges(
          fromRemoteContextSave: [NSDeletedObjectsKey: ids],
          into: [context]
        )
      }
    }
  }

  func deleteAll() {
    context.performAndWait {
      let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
      let batchDelete = NSBatchDeleteRequest(fetchRequest: req)
      batchDelete.resultType = .resultTypeObjectIDs
      if let result = try? context.execute(batchDelete) as? NSBatchDeleteResult,
         let ids = result.result as? [NSManagedObjectID] {
        NSManagedObjectContext.mergeChanges(
          fromRemoteContextSave: [NSDeletedObjectsKey: ids],
          into: [context]
        )
      }
    }
  }
}

extension StoredLocation {
  @nonobjc class func fetchRequest() -> NSFetchRequest<StoredLocation> {
    return NSFetchRequest<StoredLocation>(entityName: "StoredLocation")
  }
}
