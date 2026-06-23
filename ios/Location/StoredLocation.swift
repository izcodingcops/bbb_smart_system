import CoreData

@objc(StoredLocation)
public class StoredLocation: NSManagedObject {
  @NSManaged public var clatitude: String?
  @NSManaged public var clongitute: String?
  @NSManaged public var ctimestamp: String?
  @NSManaged public var onlineOrOffline: String?
  @NSManaged public var chorizontalAccuracy: String?
}
